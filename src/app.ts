import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import config from "./config/index.js";
import { authRoutes } from "./modules/auth/auth.route.js";
import { notFound } from "./middlewares/notFound.js";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.js";
import { userRoutes } from "./modules/user/user.route.js";
import { landlordPropertyRoutes, propertyRoutes } from "./modules/property/property.route.js";
import { adminRoutes } from "./modules/admin/admin.route.js";
import { landlordRentalRoutes, rentalRoutes } from "./modules/rentalRequest/rent.routes.js";
import { paymentRoutes } from "./modules/payment/payment.route.js";
import { reviewRoutes } from "./modules/reviews/review.route.js";
import { categoryRoutes } from "./modules/category/category.route.js";
import { RateLimiter } from "./middlewares/rateLimiter.js";
import helmet from "helmet";
import compression from "compression";



const app : Application = express();

app.use(helmet());
app.use(compression());
app.use(cors({
    origin : config.app_url,
    credentials : true,
}))
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended : true }));
app.use(cookieParser())
app.use(RateLimiter.generalLimiter);

app.get("/",(req : Request, res : Response) => {
    res.send("Hello, World!");
});


app.use("/api/auth", RateLimiter.authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/landlord/properties", landlordPropertyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/rentals", rentalRoutes);
app.use("/api/landlord/requests", landlordRentalRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/categories", categoryRoutes);

app.use(notFound);
app.use(globalErrorHandler);
export default app;