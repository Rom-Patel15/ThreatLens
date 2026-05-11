import { motion } from "framer-motion";

const map: Record<string, string> = {
  LOW: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  MEDIUM: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  HIGH: "bg-orange-500/15 text-orange-200 border-orange-500/30",
  CRITICAL: "bg-rose-600/20 text-rose-100 border-rose-500/40 shadow-[0_0_20px_rgba(251,113,133,0.25)]",
  MALICIOUS:
    "bg-fuchsia-950/40 text-fuchsia-100 border-fuchsia-400/50 shadow-[0_0_26px_rgba(232,121,249,0.35)]",
};

export function RiskBadge({ level }: { level: string }) {
  const cls = map[level] ?? "bg-slate-500/15 text-slate-200 border-slate-500/30";
  return (
    <motion.span
      layout
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${cls}`}
    >
      {level}
    </motion.span>
  );
}
