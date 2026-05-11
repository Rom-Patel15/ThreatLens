import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import type { OtpChallenge } from "../../context/AuthContext";
import { Button } from "../ui/Button";

type Props = {
  challenge: OtpChallenge;
  onVerified: () => void;
  verifyOtp: (challengeId: string, code: string) => Promise<void>;
  resendOtp: (challengeId: string) => Promise<{ expiresAt: string }>;
  cooldownSeconds: number;
};

export function OtpVerificationPanel({ challenge, onVerified, verifyOtp, resendOtp, cooldownSeconds }: Props) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [expiresAt, setExpiresAt] = useState(new Date(challenge.expiresAt));
  const [now, setNow] = useState(Date.now());
  const [resendSec, setResendSec] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setExpiresAt(new Date(challenge.expiresAt));
  }, [challenge.expiresAt, challenge.challengeId]);

  const otpRemaining = useMemo(() => Math.max(0, Math.floor((expiresAt.getTime() - now) / 1000)), [expiresAt, now]);

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length < 4) {
      toast.error("Enter the code from your email");
      return;
    }
    setBusy(true);
    try {
      await verifyOtp(challenge.challengeId, code.trim());
      toast.success("Verified — session secured");
      onVerified();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  async function onResend() {
    if (resendSec > 0) return;
    setResendBusy(true);
    try {
      const { expiresAt: next } = await resendOtp(challenge.challengeId);
      setExpiresAt(new Date(next));
      setCode("");
      setResendSec(cooldownSeconds);
      toast.success("A new code was sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resend");
    } finally {
      setResendBusy(false);
    }
  }

  useEffect(() => {
    if (resendSec <= 0) return;
    const t = setInterval(() => setResendSec((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendSec]);

  const mm = String(Math.floor(otpRemaining / 60)).padStart(2, "0");
  const ss = String(otpRemaining % 60).padStart(2, "0");

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-4 text-sm text-cyan-100/90">
        <p className="font-medium text-cyan-50">Email verification required</p>
        <p className="mt-1 text-xs text-cyan-100/70">
          We sent a one-time code to <span className="font-semibold">{challenge.email}</span>. Codes expire for
          security — this mirrors production SaaS flows.
        </p>
      </div>
      <form onSubmit={onVerify} className="space-y-4">
        <div>
          <label htmlFor="tl-otp" className="text-xs uppercase tracking-wide text-slate-400">
            One-time code
          </label>
          <input
            id="tl-otp"
            name="one-time-code"
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            className="mt-1 w-full rounded-xl border border-white/10 bg-night-950/60 px-3 py-3 text-center font-mono text-2xl tracking-[0.35em] outline-none ring-cyan-400/40 focus:ring-2"
            placeholder="••••••"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Code expires in{" "}
            <span className={otpRemaining < 60 ? "text-rose-300" : "text-slate-200"}>
              {mm}:{ss}
            </span>
          </span>
          <button
            type="button"
            onClick={onResend}
            disabled={resendBusy || resendSec > 0 || otpRemaining === 0}
            className="text-cyan-300 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
          >
            {resendSec > 0 ? `Resend in ${resendSec}s` : resendBusy ? "Sending…" : "Resend code"}
          </button>
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Verifying…" : "Verify & continue"}
        </Button>
      </form>
    </motion.div>
  );
}
