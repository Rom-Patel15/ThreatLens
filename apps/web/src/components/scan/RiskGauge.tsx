import { motion } from "framer-motion";

/** Semi-circular SOC-style risk gauge (0–100 threat probability). */
export function RiskGauge({ value, label }: { value: number; label: string }) {
  const v = Math.min(100, Math.max(0, value));
  const rotation = -90 + (v / 100) * 180;
  return (
    <div className="relative mx-auto h-44 w-44">
      <svg viewBox="0 0 120 80" className="h-full w-full">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="55%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#fb7185" />
          </linearGradient>
        </defs>
        <path
          d="M 12 70 A 48 48 0 0 1 108 70"
          fill="none"
          stroke="rgba(148,163,184,0.25)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <motion.path
          d="M 12 70 A 48 48 0 0 1 108 70"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(v / 100) * 151} 151`}
          initial={{ strokeDasharray: "0 151" }}
          animate={{ strokeDasharray: `${(v / 100) * 151} 151` }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
        />
        <motion.g
          style={{ transformOrigin: "60px 70px" }}
          initial={{ rotate: -90 }}
          animate={{ rotate: rotation }}
          transition={{ type: "spring", stiffness: 90, damping: 16 }}
        >
          <line x1="60" y1="70" x2="60" y2="30" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
          <circle cx="60" cy="70" r="5" fill="#0f172a" stroke="#22d3ee" strokeWidth="2" />
        </motion.g>
      </svg>
      <div className="absolute inset-x-0 bottom-2 text-center">
        <div className="font-display text-3xl font-bold text-white">{Math.round(v)}</div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
      </div>
    </div>
  );
}
