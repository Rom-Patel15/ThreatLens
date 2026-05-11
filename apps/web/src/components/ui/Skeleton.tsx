import { motion } from "framer-motion";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-lg bg-white/5 ${className}`}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.1 }}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </motion.div>
  );
}
