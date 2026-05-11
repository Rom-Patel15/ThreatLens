import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import * as auth from "../controllers/authController.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().max(120).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const verifySchema = z.object({
  challengeId: z.string().min(10),
  code: z.string().min(4).max(12),
});

const resendSchema = z.object({
  challengeId: z.string().min(10),
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRouter = Router();

authRouter.post("/register", registerLimiter, validateBody(registerSchema), asyncHandler(auth.register));
authRouter.post("/login", loginLimiter, validateBody(loginSchema), asyncHandler(auth.login));
authRouter.post("/verify-otp", verifyLimiter, validateBody(verifySchema), asyncHandler(auth.verifyOtp));
authRouter.post("/resend-otp", verifyLimiter, validateBody(resendSchema), asyncHandler(auth.resendOtp));
authRouter.get("/me", requireAuth, asyncHandler(auth.me));
