import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

const links = [
  { to: "/", label: "Command", end: true },
  { to: "/scanner", label: "Threat Scanner" },
  { to: "/lab", label: "Threat Lab" },
  { to: "/feed", label: "Intel Feed" },
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-[#09111b] p-4 lg:flex">
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-100 font-display text-lg font-bold">
          TL
        </div>
        <div>
          <div className="font-display text-lg font-semibold tracking-tight">ThreatLens</div>
          <div className="text-xs text-slate-500">Risk intelligence</div>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `relative rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive ? "text-white" : "text-slate-500 hover:text-slate-200"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="navpill"
                    className="absolute inset-0 rounded-xl border border-slate-700 bg-slate-900"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{l.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs text-slate-400">
        Hybrid engine: deterministic heuristics first, analyst-grade AI explanations on demand.
      </div>
    </aside>
  );
}
