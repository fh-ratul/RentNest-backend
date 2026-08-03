import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import config from "./config";
import { authRoutes } from "./modules/auth/auth.route";
import { notFound } from "./middlewares/notFound";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { userRoutes } from "./modules/user/user.route";
import { landlordPropertyRoutes, propertyRoutes } from "./modules/property/property.route";



const app : Application = express();

app.use(cors({
    origin : config.app_url,
    credentials : true,
}))

app.use(express.json());
app.use(express.urlencoded({ extended : true }));
app.use(cookieParser())


app.get("/",(req : Request, res : Response) => {
    res.send("Hello, World!");
});


app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/landlord/properties", landlordPropertyRoutes);


app.use(notFound);
app.use(globalErrorHandler);
export default app;