import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import type { OtpPurpose } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { sendOtpEmail } from "./mailService.js";

function otpCode(): string {
  return String(randomInt(100000, 999999));
}

async function audit(
  email: string,
  userId: string | undefined,
  event: string,
  opts?: { challengeId?: string; ip?: string; metadata?: object }
) {
  await prisma.otpAuditLog.create({
    data: {
      email,
      userId,
      event,
      challengeId: opts?.challengeId,
      ipAddress: opts?.ip,
      metadata: opts?.metadata as object | undefined,
    },
  });
}

/** Revokes other active challenges for same user+purpose so only the latest is valid. */
async function revokeSiblings(userId: string, purpose: OtpPurpose, exceptId?: string) {
  await prisma.otpChallenge.updateMany({
    where: {
      userId,
      purpose,
      consumedAt: null,
      revokedAt: null,
      ...(exceptId ? { NOT: { id: exceptId } } : {}),
    },
    data: { revokedAt: new Date() },
  });
}

export async function assertOtpSendRate(email: string, ip: string) {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const sent = await prisma.otpAuditLog.count({
    where: {
      email: email.toLowerCase(),
      event: { in: ["OTP_SENT", "OTP_RESENT"] },
      createdAt: { gte: since },
    },
  });
  if (sent >= env.OTP_MAX_SENDS_PER_EMAIL_HOUR) {
    await audit(email.toLowerCase(), undefined, "RATE_LIMIT", { ip, metadata: { reason: "hourly_email_cap" } });
    throw new Error("RATE_LIMIT_EMAIL");
  }
}

export async function createOtpChallenge(params: {
  userId: string;
  email: string;
  purpose: OtpPurpose;
  ip: string;
}) {
  const { userId, email, purpose, ip } = params;
  const normalized = email.toLowerCase();
  await assertOtpSendRate(normalized, ip);

  const code = otpCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

  await revokeSiblings(userId, purpose);

  const challenge = await prisma.otpChallenge.create({
    data: {
      email: normalized,
      userId,
      purpose,
      codeHash,
      expiresAt,
      ipAddress: ip,
    },
  });

  const mailPurpose = purpose === "SIGNUP_VERIFY" ? "signup" : "login";
  await sendOtpEmail(normalized, code, mailPurpose);
  await audit(normalized, userId, "OTP_SENT", { challengeId: challenge.id, ip });

  return { challengeId: challenge.id, expiresAt };
}

export async function resendOtpChallenge(params: { challengeId: string; ip: string }) {
  const existing = await prisma.otpChallenge.findUnique({ where: { id: params.challengeId } });
  if (!existing || existing.revokedAt || existing.consumedAt) {
    throw new Error("INVALID_CHALLENGE");
  }
  if (existing.expiresAt < new Date()) {
    throw new Error("CHALLENGE_EXPIRED");
  }

  const cooldownMs = env.OTP_RESEND_COOLDOWN_SECONDS * 1000;
  if (Date.now() - existing.lastSentAt.getTime() < cooldownMs) {
    await audit(existing.email, existing.userId, "RESEND_COOLDOWN", {
      challengeId: existing.id,
      ip: params.ip,
    });
    throw new Error("RESEND_COOLDOWN");
  }

  await assertOtpSendRate(existing.email, params.ip);

  const code = otpCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpChallenge.update({
    where: { id: existing.id },
    data: {
      codeHash,
      expiresAt,
      attempts: 0,
      lastSentAt: new Date(),
    },
  });

  const mailPurpose = existing.purpose === "SIGNUP_VERIFY" ? "signup" : "login";
  await sendOtpEmail(existing.email, code, mailPurpose);
  await audit(existing.email, existing.userId, "OTP_RESENT", { challengeId: existing.id, ip: params.ip });

  return { challengeId: existing.id, expiresAt };
}

export async function verifyOtpChallenge(params: { challengeId: string; code: string; ip: string }) {
  const challenge = await prisma.otpChallenge.findUnique({ where: { id: params.challengeId } });
  if (!challenge || challenge.revokedAt || challenge.consumedAt) {
    await audit("unknown", undefined, "VERIFY_FAIL", { ip: params.ip, metadata: { reason: "invalid_challenge" } });
    throw new Error("INVALID_CHALLENGE");
  }
  if (challenge.expiresAt < new Date()) {
    await audit(challenge.email, challenge.userId, "VERIFY_FAIL", {
      challengeId: challenge.id,
      ip: params.ip,
      metadata: { reason: "expired" },
    });
    throw new Error("CHALLENGE_EXPIRED");
  }
  if (challenge.attempts >= challenge.maxAttempts) {
    await audit(challenge.email, challenge.userId, "VERIFY_FAIL", {
      challengeId: challenge.id,
      ip: params.ip,
      metadata: { reason: "max_attempts" },
    });
    throw new Error("OTP_LOCKED");
  }

  const ok = await bcrypt.compare(params.code.trim(), challenge.codeHash);
  if (!ok) {
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    await audit(challenge.email, challenge.userId, "VERIFY_FAIL", {
      challengeId: challenge.id,
      ip: params.ip,
      metadata: { reason: "bad_code" },
    });
    throw new Error("INVALID_CODE");
  }

  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() },
  });
  await audit(challenge.email, challenge.userId, "VERIFY_SUCCESS", { challengeId: challenge.id, ip: params.ip });

  return challenge;
}
