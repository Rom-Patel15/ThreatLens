import { motion } from "framer-motion";

export function ThreatMeter({ value, label = "Signal strength" }: { value: number; label?: string }) {
  const v = Math.min(100, Math.max(0, value));
  const color =
    v >= 90 ? "from-rose-500 to-orange-400" : v >= 70 ? "from-orange-500 to-amber-400" : v >= 45 ? "from-amber-400 to-cyan-400" : "from-emerald-400 to-cyan-500";
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>{Math.round(v)} / 100</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${color} shadow-[0_0_24px_rgba(34,211,238,0.25)]`}
          initial={{ width: 0 }}
          animate={{ width: `${v}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}
