import type { ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  primary:
    "border border-teal-700 bg-teal-700 text-slate-50 font-semibold hover:border-teal-600 hover:bg-teal-600",
  ghost: "border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-100",
  danger: "border border-rose-900 bg-rose-950/70 text-rose-200 hover:bg-rose-900/80",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: keyof typeof variants;
}) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-colors duration-200 disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
