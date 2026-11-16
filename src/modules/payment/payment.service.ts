import httpStatus from "http-status";
import { Prisma } from "@prisma/client";
import type Stripe from "stripe";
import config from "../../config/index.js";
import { prisma } from "../../lib/prisma.js";
import { stripe } from "../../lib/stripe.js";
import { ApiError } from "../../utils/apiError.js";
import { assertValidTransition } from "../rentalRequest/rent.utils.js";

const paymentInclude = {
  rentalRequest: { include: { property: true } },
} as const;

// Refunds a session paid for a rental that was already paid through another
// session. The key stops the webhook and the success page refunding twice.
const refundDuplicateCharge = async (session: Stripe.Checkout.Session) => {
  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;
  if (!paymentIntent) {
    throw new ApiError(
      httpStatus.BAD_GATEWAY,
      `Cannot refund duplicate session ${session.id}: no payment intent`,
    );
  }

  try {
    await stripe.refunds.create(
      { payment_intent: paymentIntent },
      { idempotencyKey: `duplicate-refund-${session.id}` },
    );
  } catch (error) {
    const alreadyRefunded =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "charge_already_refunded";
    if (!alreadyRefunded) throw error;
  }
  console.warn(
    `Refunded duplicate payment: session ${session.id}, rental ${session.metadata?.rentalRequestId}`,
  );
};

const completeStripePayment = async (session: Stripe.Checkout.Session) => {
  const bySession = await prisma.payment.findUnique({
    where: { stripeSessionId: session.id },
    include: paymentInclude,
  });

  if (bySession?.status === "COMPLETED") {
    return bySession;
  }

  if (session.payment_status !== "paid") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Payment has not been completed yet",
    );
  }

  const rentalRequestId =
    bySession?.rentalRequestId ?? session.metadata?.rentalRequestId;

  if (!rentalRequestId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Missing rental request reference on payment session",
    );
  }

  // A paid session that isn't on the payment row comes from an older checkout
  // tab. It settles the rental's payment, or is refunded if that's already paid.
  const payment =
    bySession ??
    (await prisma.payment.findUnique({
      where: { rentalRequestId },
      include: paymentInclude,
    }));

  if (payment?.status === "COMPLETED") {
    await refundDuplicateCharge(session);
    return payment;
  }

  const rental =
    payment?.rentalRequest ??
    (await prisma.rentalRequest.findUnique({
      where: { id: rentalRequestId },
      include: { property: true },
    }));

  if (!rental) {
    throw new ApiError(httpStatus.NOT_FOUND, "Rental request not found");
  }

  if (rental.status !== "ACTIVE") {
    assertValidTransition(rental.status, "ACTIVE");
  }

  const transactionId =
    typeof session.payment_intent === "string" ? session.payment_intent : null;

  if (payment) {
    const result = await prisma.$transaction(async (tx) => {
      // Conditional update: only one concurrent call can move the payment to COMPLETED.
      const { count } = await tx.payment.updateMany({
        where: { id: payment.id, status: { not: "COMPLETED" } },
        data: {
          status: "COMPLETED",
          stripeSessionId: session.id,
          transactionId,
          paidAt: new Date(),
        },
      });

      // Another call (webhook or /confirm) already completed this payment,
      // possibly with a different session.
      if (count === 0) {
        return tx.payment.findUniqueOrThrow({ where: { id: payment.id } });
      }

      await tx.rentalRequest.update({
        where: { id: rental.id },
        data: { status: "ACTIVE" },
      });

      await tx.property.update({
        where: { id: rental.propertyId },
        data: { status: "RENTED" },
      });

      return tx.payment.findUniqueOrThrow({ where: { id: payment.id } });
    });

    if (result.stripeSessionId !== session.id) {
      // Two sessions were paid at once and the other one won.
      await refundDuplicateCharge(session);
    } else if (
      payment.stripeSessionId &&
      payment.stripeSessionId !== session.id
    ) {
      // An older tab's session paid the rental: close the newer one so it
      // can't be paid too. If it was paid already, its webhook refunds it.
      await stripe.checkout.sessions
        .expire(payment.stripeSessionId)
        .catch(() => undefined);
    }
    return result;
  }

  const amount = Number(rental.property.price);

  try {
    return await prisma.$transaction(async (tx) => {
      const createdPayment = await tx.payment.create({
        data: {
          rentalRequestId: rental.id,
          amount,
          stripeSessionId: session.id,
          transactionId,
          status: "COMPLETED",
          paidAt: new Date(),
        },
      });

      await tx.rentalRequest.update({
        where: { id: rental.id },
        data: { status: "ACTIVE" },
      });

      await tx.property.update({
        where: { id: rental.propertyId },
        data: { status: "RENTED" },
      });

      return createdPayment;
    });
  } catch (error) {
    // A concurrent call already created the payment. P2002 aborts the
    // transaction, so the existing row is read outside it.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existingPayment = await prisma.payment.findUnique({
        where: { rentalRequestId: rental.id },
      });
      if (existingPayment?.stripeSessionId === session.id) {
        return existingPayment;
      }
      if (existingPayment?.status === "COMPLETED") {
        await refundDuplicateCharge(session);
        return existingPayment;
      }
    }
    throw error;
  }
};

const createPayment = async (tenantId: string, rentalRequestId: string) => {
  const rental = await prisma.rentalRequest.findUnique({
    where: { id: rentalRequestId },
    include: { property: true, payment: true },
  });

  if (!rental) {
    throw new ApiError(httpStatus.NOT_FOUND, "Rental request not found");
  }
  if (rental.tenantId !== tenantId) {
    throw new ApiError(httpStatus.FORBIDDEN, "This is not your rental request");
  }
  if (rental.status !== "APPROVED") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Rental request must be APPROVED by the landlord before payment",
    );
  }
  if (rental.property.status !== "AVAILABLE") {
    throw new ApiError(
      httpStatus.CONFLICT,
      "This property has already been rented",
    );
  }
  if (rental.payment?.status === "COMPLETED") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "A payment already exists for this rental request",
    );
  }

  // Starting checkout is idempotent: a rental has at most one payable session.
  // Clicking Pay again returns the open session instead of creating a second
  // one the tenant could also pay.
  const previousSessionId = rental.payment?.stripeSessionId ?? null;
  if (
    rental.payment &&
    previousSessionId &&
    rental.payment.status === "PENDING"
  ) {
    const previous = await stripe.checkout.sessions.retrieve(previousSessionId);

    if (previous.status === "open" && previous.url) {
      return {
        paymentUrl: previous.url,
        sessionId: previous.id,
        paymentId: rental.payment.id,
      };
    }

    if (previous.status === "complete") {
      if (previous.payment_status !== "paid") {
        throw new ApiError(
          httpStatus.CONFLICT,
          "A payment for this rental is still being processed",
        );
      }
      // Paid, but the webhook hasn't arrived yet: settle it now and send the
      // tenant to the success page rather than charging them again.
      await completeStripePayment(previous);
      return {
        paymentUrl: `${config.app_url}/payments/success?session_id=${previous.id}`,
        sessionId: previous.id,
        paymentId: rental.payment.id,
      };
    }
    // Expired: fall through and create a new session.
  }

  const amount = Number(rental.property.price);
  const unitAmount = Math.round(amount * 100);

  // Two Pay clicks that arrive together both get past the check above. The key
  // makes Stripe return the same session to both. It changes once the previous
  // session is replaced (or the price changes), so an expired session is never
  // handed back.
  const idempotencyKey = `checkout-${rental.id}-${previousSessionId ?? "first"}-${unitAmount}`;

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            // Rent is stored in BDT; unit_amount is in poisha (1/100 taka).
            currency: "bdt",
            product_data: { name: `Rent payment - ${rental.property.title}` },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${config.app_url}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.app_url}/payments/cancel`,
      metadata: { rentalRequestId: rental.id, tenantId },
    },
    { idempotencyKey },
  );

  if (!session.url) {
    throw new ApiError(
      httpStatus.BAD_GATEWAY,
      "Stripe checkout session did not return a payment URL",
    );
  }

  // A PENDING/FAILED payment row is reused (rentalRequestId is unique).
  const payment = rental.payment
    ? await prisma.payment.update({
        where: { id: rental.payment.id },
        data: { stripeSessionId: session.id, status: "PENDING", amount },
      })
    : await prisma.payment.create({
        data: {
          rentalRequestId: rental.id,
          amount,
          stripeSessionId: session.id,
          status: "PENDING",
        },
      });

  return {
    paymentUrl: session.url,
    sessionId: session.id,
    paymentId: payment.id,
  };
};

const confirmPayment = async (tenantId: string, sessionId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { stripeSessionId: sessionId },
    include: paymentInclude,
  });

  if (payment) {
    if (payment.rentalRequest.tenantId !== tenantId) {
      throw new ApiError(httpStatus.FORBIDDEN, "This is not your payment");
    }
    if (payment.status === "COMPLETED") {
      return payment;
    }
  }

  // No row for this session: it may be an older checkout tab's session, so
  // ask Stripe and check it belongs to this tenant.
  const notFound = new ApiError(
    httpStatus.NOT_FOUND,
    "No payment found for this session",
  );
  const session = await stripe.checkout.sessions
    .retrieve(sessionId)
    .catch(() => {
      throw notFound;
    });
  if (!payment && session.metadata?.tenantId !== tenantId) {
    throw notFound;
  }

  if (session.payment_status !== "paid") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Payment has not been completed yet",
    );
  }

  return completeStripePayment(session);
};

const getMyPayments = async (tenantId: string) => {
  return prisma.payment.findMany({
    where: { rentalRequest: { tenantId } },
    include: { rentalRequest: { include: { property: true } } },
    orderBy: { createdAt: "desc" },
  });
};

const getPaymentById = async (id: string, userId: string, role: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      rentalRequest: {
        include: {
          property: true,
          tenant: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Payment not found");
  }

  const isTenant = payment.rentalRequest.tenantId === userId;
  const isLandlord = payment.rentalRequest.property.landlordId === userId;

  if (role !== "ADMIN" && !isTenant && !isLandlord) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You don't have access to this payment",
    );
  }

  return payment;
};

const handleWebhookEvent = async (event: Stripe.Event) => {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      // Async methods complete as "unpaid" first; async_payment_succeeded follows.
      if (session.payment_status === "paid") {
        await completeStripePayment(session);
      }
      break;
    }
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await prisma.payment.updateMany({
        where: { stripeSessionId: session.id, status: "PENDING" },
        data: { status: "FAILED" },
      });
      break;
    }
    default:
      break;
  }
};

export const paymentService = {
  createPayment,
  confirmPayment,
  handleWebhookEvent,
  getMyPayments,
  getPaymentById,
};
