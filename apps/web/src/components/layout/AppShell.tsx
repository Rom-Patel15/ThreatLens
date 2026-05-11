import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";

const mobileLinks = [
  { to: "/", label: "Command", end: true },
  { to: "/scanner", label: "Threat Scanner" },
  { to: "/lab", label: "Threat Lab" },
  { to: "/feed", label: "Intel Feed" },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-grid-pattern">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-[#08101a]/96 px-4 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-100 lg:hidden"
              aria-label="Open navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <span className="text-lg">≡</span>
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Operations</p>
              <h1 className="font-display text-xl font-semibold">Security Command</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-sm sm:block">
              <div className="font-medium text-slate-100">{user?.name || "Operator"}</div>
              <div className="text-xs text-slate-400">{user?.email}</div>
            </div>
            <Button variant="ghost" className="!px-3 !py-2 text-xs" onClick={logout}>
              Sign out
            </Button>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <MobileNav />

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/75"
              aria-label="Close navigation"
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="absolute left-0 top-0 flex h-full w-[min(88vw,320px)] flex-col border-r border-slate-800 bg-[#09111b] p-4 shadow-card"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="font-display text-lg font-semibold">ThreatLens</div>
                <button
                  type="button"
                  className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300"
                  onClick={() => setMenuOpen(false)}
                >
                  Close
                </button>
              </div>
              <nav className="flex flex-col gap-1">
                {mobileLinks.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `rounded-xl px-3 py-3 text-sm font-medium ${
                        isActive ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-100"
                      }`
                    }
                  >
                    {l.label}
                  </NavLink>
                ))}
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
