import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import type { OtpChallenge } from "../context/AuthContext";
import { useAuth } from "../context/AuthContext";
import { OtpVerificationPanel } from "../components/auth/OtpVerificationPanel";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

const RESEND_COOLDOWN = 60;

export default function Login() {
  const { login, verifyOtp, resendOtp } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [otp, setOtp] = useState<OtpChallenge | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await login(email, password);
      if (result.otp) {
        setOtp(result.otp);
        toast.success("Check your inbox for a verification code");
        return;
      }
      toast.success("Session established");
      nav("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 font-display text-xl font-bold text-night-950">
            TL
          </div>
          <h1 className="font-display text-3xl font-semibold">ThreatLens</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in to your intelligence workspace</p>
        </div>
        <Card glow>
          {!otp ? (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="text-xs uppercase tracking-wide text-slate-400">
                  Email
                </label>
                <input
                  id="login-email"
                  name="username"
                  autoComplete="username"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-night-950/60 px-3 py-2.5 text-sm outline-none ring-cyan-400/40 focus:ring-2"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="login-password" className="text-xs uppercase tracking-wide text-slate-400">
                  Password
                </label>
                <input
                  id="login-password"
                  name="password"
                  autoComplete="current-password"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-night-950/60 px-3 py-2.5 text-sm outline-none ring-cyan-400/40 focus:ring-2"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Continuing…" : "Continue"}
              </Button>
            </form>
          ) : (
            <OtpVerificationPanel
              challenge={otp}
              cooldownSeconds={RESEND_COOLDOWN}
              verifyOtp={verifyOtp}
              resendOtp={resendOtp}
              onVerified={() => nav("/")}
            />
          )}
          {!otp ? (
            <p className="mt-4 text-center text-sm text-slate-400">
              New operator?{" "}
              <Link className="text-cyan-300 hover:underline" to="/register">
                Create account
              </Link>
            </p>
          ) : (
            <button
              type="button"
              className="mt-4 w-full text-center text-xs text-slate-500 hover:text-slate-300"
              onClick={() => setOtp(null)}
            >
              ← Use different account
            </button>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
