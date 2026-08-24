import { RequestHandler } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import type { ZodTypeAny } from "zod";

export const validateRequest = (schema: ZodTypeAny): RequestHandler =>
  catchAsync(async (req, res, next) => {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  });
