import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";
import { prisma } from "../lib/prisma.js";
import { logActivity } from "../services/activityLog.js";
import type { AuthPayload } from "../middleware/auth.js";
import { createOtpChallenge, resendOtpChallenge, verifyOtpChallenge } from "../services/otpService.js";
import { getClientIp } from "../utils/clientIp.js";

function signToken(payload: AuthPayload) {
  const options = { expiresIn: env.JWT_EXPIRES_IN } as SignOptions;
  return jwt.sign(payload, env.JWT_SECRET, options);
}

function mapOtpError(code: string): AppError {
  switch (code) {
    case "RATE_LIMIT_EMAIL":
      return new AppError("Too many verification emails sent. Try again later.", 429, "OTP_RATE_LIMIT");
    case "INVALID_CHALLENGE":
      return new AppError("Invalid or expired verification session.", 400, "INVALID_CHALLENGE");
    case "CHALLENGE_EXPIRED":
      return new AppError("Code expired. Request a new one.", 400, "OTP_EXPIRED");
    case "OTP_LOCKED":
      return new AppError("Too many invalid attempts. Request a new code.", 423, "OTP_LOCKED");
    case "INVALID_CODE":
      return new AppError("Invalid verification code.", 400, "INVALID_CODE");
    case "RESEND_COOLDOWN":
      return new AppError(`Please wait ${env.OTP_RESEND_COOLDOWN_SECONDS}s before resending.`, 429, "RESEND_COOLDOWN");
    default:
      return new AppError("Verification failed", 400, "OTP_ERROR");
  }
}

export async function register(req: Request, res: Response) {
  const { email, password, name } = req.body as { email: string; password: string; name?: string };
  const normalized = email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) throw new AppError("Email already registered", 409, "EMAIL_IN_USE");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email: normalized,
      passwordHash,
      name: name?.trim() || null,
      emailVerified: false,
    },
  });

  await logActivity(user.id, "REGISTER_REQUEST", { email: user.email });

  const ip = getClientIp(req);
  try {
    const otp = await createOtpChallenge({
      userId: user.id,
      email: user.email,
      purpose: "SIGNUP_VERIFY",
      ip,
    });
    return res.status(202).json({
      requiresOtp: true,
      challengeId: otp.challengeId,
      expiresAt: otp.expiresAt,
      email: user.email,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "RATE_LIMIT_EMAIL") throw mapOtpError(msg);
    throw e;
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };
  const normalized = email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");

  await logActivity(user.id, "LOGIN_OTP_REQUESTED");

  const ip = getClientIp(req);
  try {
    const otp = await createOtpChallenge({
      userId: user.id,
      email: user.email,
      purpose: "LOGIN",
      ip,
    });
    return res.json({
      requiresOtp: true,
      challengeId: otp.challengeId,
      expiresAt: otp.expiresAt,
      email: user.email,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "RATE_LIMIT_EMAIL") throw mapOtpError(msg);
    throw e;
  }
}

export async function verifyOtp(req: Request, res: Response) {
  const { challengeId, code } = req.body as { challengeId: string; code: string };
  if (!challengeId || !code) throw new AppError("challengeId and code are required", 400);

  const ip = getClientIp(req);
  let challenge;
  try {
    challenge = await verifyOtpChallenge({ challengeId, code, ip });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    throw mapOtpError(msg);
  }

  if (challenge.purpose === "SIGNUP_VERIFY") {
    await prisma.user.update({
      where: { id: challenge.userId },
      data: { emailVerified: true },
    });
  }

  const user = await prisma.user.findUnique({ where: { id: challenge.userId } });
  if (!user) throw new AppError("User not found", 404);

  await logActivity(user.id, "OTP_VERIFIED", { purpose: challenge.purpose });

  const token = signToken({ userId: user.id, email: user.email });
  return res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified },
  });
}

export async function resendOtp(req: Request, res: Response) {
  const { challengeId } = req.body as { challengeId: string };
  if (!challengeId) throw new AppError("challengeId is required", 400);
  const ip = getClientIp(req);
  try {
    const otp = await resendOtpChallenge({ challengeId, ip });
    return res.json({ challengeId: otp.challengeId, expiresAt: otp.expiresAt });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    throw mapOtpError(msg);
  }
}

export async function me(req: Request, res: Response) {
  const userId = req.user!.userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, emailVerified: true, createdAt: true },
  });
  if (!user) throw new AppError("User not found", 404);
  return res.json({ user });
}
