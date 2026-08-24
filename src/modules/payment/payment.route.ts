import { Router } from "express";
import { paymentController } from "./payment.controller.js";
import { auth } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { paymentValidation } from "./payment.validation.js";
import { Role } from "@prisma/client";

const router = Router();

router.post("/create", auth(Role.TENANT), validateRequest(paymentValidation.createSchema), paymentController.createPayment);
router.post("/confirm", auth(Role.TENANT), validateRequest(paymentValidation.confirmSchema), paymentController.confirmPayment);
router.get("/", auth(Role.TENANT), paymentController.getMyPayments);
router.get("/:id", auth(), paymentController.getPaymentById);

export const paymentRoutes = router;
