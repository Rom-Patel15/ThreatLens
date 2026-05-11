import "dotenv/config";

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: num(process.env.PORT, 4000),
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  JWT_SECRET: process.env.JWT_SECRET ?? "dev-only-change-me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",

  /** smtp | resend | console — console logs OTP in development */
  EMAIL_PROVIDER: (process.env.EMAIL_PROVIDER ?? "console").toLowerCase(),
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: num(process.env.SMTP_PORT, 587),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM ?? "ThreatLens <no-reply@threatlens.local>",
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM: process.env.RESEND_FROM ?? "ThreatLens <onboarding@resend.dev>",

  OTP_EXPIRY_MINUTES: num(process.env.OTP_EXPIRY_MINUTES, 10),
  OTP_RESEND_COOLDOWN_SECONDS: num(process.env.OTP_RESEND_COOLDOWN_SECONDS, 60),
  OTP_MAX_SENDS_PER_EMAIL_HOUR: num(process.env.OTP_MAX_SENDS_PER_EMAIL_HOUR, 8),
};
