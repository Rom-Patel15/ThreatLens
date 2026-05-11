import nodemailer from "nodemailer";
import { env } from "../config/env.js";

/**
 * Sends transactional email for OTP. Supports SMTP (Nodemailer), Resend HTTP API, or console sink for demos.
 */
export async function sendOtpEmail(to: string, code: string, purpose: "signup" | "login") {
  const subject =
    purpose === "signup" ? "Verify your ThreatLens account" : "Your ThreatLens login verification code";
  const text = `Your ThreatLens verification code is: ${code}\n\nThis code expires in ${env.OTP_EXPIRY_MINUTES} minutes.\nIf you did not request this, you can ignore this email.`;
  const html = `
    <div style="font-family:system-ui,sans-serif;background:#0a0f18;color:#e2e8f0;padding:24px;border-radius:12px;">
      <h2 style="margin:0 0 12px;">ThreatLens security code</h2>
      <p style="margin:0 0 16px;">Use the one-time code below to ${purpose === "signup" ? "finish creating your workspace" : "complete your sign-in"}.</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:6px;color:#22d3ee;">${code}</div>
      <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;">Expires in ${env.OTP_EXPIRY_MINUTES} minutes. Do not share this code.</p>
    </div>`;

  if (env.EMAIL_PROVIDER === "console") {
    console.info(`[mail:console] OTP to ${to}: ${code} (${purpose})`);
    return;
  }

  if (env.EMAIL_PROVIDER === "resend" && env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM,
        to: [to],
        subject,
        html,
        text,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend failed: ${res.status} ${body}`);
    }
    return;
  }

  if (env.EMAIL_PROVIDER === "smtp") {
    if (!env.SMTP_HOST) throw new Error("SMTP_HOST is required for smtp provider");
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
          : undefined,
    });
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      text,
      html,
    });
    return;
  }

  console.warn(`[mail] Unknown EMAIL_PROVIDER=${env.EMAIL_PROVIDER}, falling back to console`);
  console.info(`[mail:fallback] OTP to ${to}: ${code}`);
}
