import { Router } from "express";
import { paymentController } from "./payment.controller";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { paymentValidation } from "./payment.validation";
import { Role } from "../../../prisma/generated/prisma/enums";

const router = Router();

router.post("/create", auth(Role.TENANT), validateRequest(paymentValidation.createSchema), paymentController.createPayment);
router.post("/confirm", auth(Role.TENANT), validateRequest(paymentValidation.confirmSchema), paymentController.confirmPayment);
router.get("/", auth(Role.TENANT), paymentController.getMyPayments);
router.get("/:id", auth(), paymentController.getPaymentById);

export const paymentRoutes = router;
