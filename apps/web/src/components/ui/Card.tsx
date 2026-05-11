import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 ${glow ? "glass-strong" : "glass"} ${className}`}>{children}</div>
  );
}
