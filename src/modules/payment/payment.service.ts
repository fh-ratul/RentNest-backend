import httpStatus from "http-status";
import Stripe from "stripe";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import { ApiError } from "../../utils/apiError";
import { assertValidTransition } from "../rentalRequest/rent.utils";

const completeStripePayment = async (session: Stripe.Checkout.Session) => {
  const payment = await prisma.payment.findUnique({
    where: { stripeSessionId: session.id },
    include: { rentalRequest: { include: { property: true } } },
  });

  if (payment?.status === "COMPLETED") {
    return payment;
  }

  if (session.payment_status !== "paid") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Payment has not been completed yet",
    );
  }

  const rentalRequestId =
    payment?.rentalRequestId ?? session.metadata?.rentalRequestId;

  if (!rentalRequestId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Missing rental request reference on payment session",
    );
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
    const [updatedPayment] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "COMPLETED",
          transactionId,
          paidAt: new Date(),
        },
      }),
      rental.status === "ACTIVE"
        ? prisma.rentalRequest.update({
            where: { id: rental.id },
            data: { status: "ACTIVE" },
          })
        : prisma.rentalRequest.update({
            where: { id: rental.id },
            data: { status: "ACTIVE" },
          }),
      prisma.property.update({
        where: { id: rental.propertyId },
        data: { status: "RENTED" },
      }),
    ]);

    return updatedPayment;
  }

  const amount = Number(rental.property.price);

  return prisma.$transaction(async (tx) => {
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
  if (rental.payment) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "A payment already exists for this rental request",
    );
  }

  const amount = Number(rental.property.price);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `Rent payment - ${rental.property.title}` },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${config.app_url}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.app_url}/payments/cancel`,
    metadata: { rentalRequestId: rental.id, tenantId },
  });

  if (!session.url) {
    throw new ApiError(
      httpStatus.BAD_GATEWAY,
      "Stripe checkout session did not return a payment URL",
    );
  }

  const payment = await prisma.payment.create({
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
    include: { rentalRequest: { include: { property: true } } },
  });

  if (!payment) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "No payment found for this session",
    );
  }
  if (payment.rentalRequest.tenantId !== tenantId) {
    throw new ApiError(httpStatus.FORBIDDEN, "This is not your payment");
  }

  if (payment.status === "COMPLETED") {
    return payment;
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

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

export const paymentService = {
  createPayment,
  confirmPayment,
  getMyPayments,
  getPaymentById,
};
