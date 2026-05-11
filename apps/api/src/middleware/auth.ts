import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "./errorHandler.js";

export type AuthPayload = { userId: string; email: string };

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    throw new AppError("Invalid or expired token", 401, "INVALID_TOKEN");
  }
}
