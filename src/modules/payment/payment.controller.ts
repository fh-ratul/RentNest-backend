import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync.js";
import { ApiError } from "../../utils/apiError.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { paymentService } from "./payment.service.js";
import Stripe from "stripe";
import { stripe } from "../../lib/stripe.js";
import config from "../../config/index.js";

const createPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.createPayment(
    req.user!.id,
    req.body.rentalRequestId,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment session created",
    data: result,
  });
});

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.confirmPayment(
    req.user!.id,
    req.body.sessionId,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment confirmed",
    data: result,
  });
});



// Not wrapped in catchAsync: Stripe needs explicit status codes (400 = bad
// signature, 500 = retry), not the global error handler's output.
const handleWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    return res.status(400).send("Missing stripe-signature header");
  }

  let event: Stripe.Event;
  try {
    // req.body is the raw Buffer (express.raw is mounted on this route in app.ts)
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      config.stripe_webhook_secret,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return res.status(400).send(`Webhook Error: ${message}`);
  }

  try {
    await paymentService.handleWebhookEvent(event);
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error(`Stripe webhook failed for ${event.type} (${event.id}):`, err);
    return res.status(500).json({ received: false });
  }
};

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.getMyPayments(req.user!.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment history retrieved",
    data: result,
  });
});

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.getPaymentById(
    req.params?.id as string,
    req.user!.id,
    req.user!.role,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment retrieved",
    data: result,
  });
});

export const paymentController = {
  createPayment,
  confirmPayment,
  handleWebhook,
  getMyPayments,
  getPaymentById,
};
