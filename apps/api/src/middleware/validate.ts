import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { AppError } from "./errorHandler.js";

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((e) => e.message).join("; ");
      throw new AppError(msg, 400, "VALIDATION_ERROR");
    }
    req.body = parsed.data;
    next();
  };
}
