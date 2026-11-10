import type { RequestHandler } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import type { ZodTypeAny } from "zod";

type TRequestParts = { body?: unknown; query?: unknown; params?: unknown };
export const validateRequest = (
  schema: ZodTypeAny<TRequestParts>,
): RequestHandler =>
  catchAsync(async (req, res, next) => {
    const parsed = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (parsed.body !== undefined) req.body = parsed.body;

    next();
  });
