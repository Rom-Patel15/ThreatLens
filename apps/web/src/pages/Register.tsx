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

export default function Register() {
  const { register, verifyOtp, resendOtp } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [otp, setOtp] = useState<OtpChallenge | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await register(email, password, name || undefined);
      if (result.otp) {
        setOtp(result.otp);
        toast.success("Verification code sent — inbox may take a few seconds");
        return;
      }
      toast.success("Workspace ready");
      nav("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-semibold">Create workspace</h1>
          <p className="mt-2 text-sm text-slate-400">Provision a ThreatLens operator account</p>
        </div>
        <Card glow>
          {!otp ? (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="reg-name" className="text-xs uppercase tracking-wide text-slate-400">
                  Display name
                </label>
                <input
                  id="reg-name"
                  name="name"
                  autoComplete="name"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-night-950/60 px-3 py-2.5 text-sm outline-none ring-cyan-400/40 focus:ring-2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label htmlFor="reg-email" className="text-xs uppercase tracking-wide text-slate-400">
                  Email
                </label>
                <input
                  id="reg-email"
                  name="email"
                  autoComplete="email"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-night-950/60 px-3 py-2.5 text-sm outline-none ring-cyan-400/40 focus:ring-2"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="reg-password" className="text-xs uppercase tracking-wide text-slate-400">
                  Password (min 8)
                </label>
                <input
                  id="reg-password"
                  name="new-password"
                  autoComplete="new-password"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-night-950/60 px-3 py-2.5 text-sm outline-none ring-cyan-400/40 focus:ring-2"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Creating…" : "Create account"}
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
              Already have access?{" "}
              <Link className="text-cyan-300 hover:underline" to="/login">
                Sign in
              </Link>
            </p>
          ) : (
            <button
              type="button"
              className="mt-4 w-full text-center text-xs text-slate-500 hover:text-slate-300"
              onClick={() => setOtp(null)}
            >
              ← Edit registration details
            </button>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
