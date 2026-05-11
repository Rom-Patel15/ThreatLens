import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/scanner", label: "Scan" },
  { to: "/lab", label: "Threat Lab" },
  { to: "/feed", label: "Feed" },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-slate-800 bg-[#09111b]/95 px-2 py-2 lg:hidden">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) =>
            `flex-1 rounded-lg py-2 text-center text-xs font-medium ${
              isActive ? "bg-slate-900 text-white" : "text-slate-500"
            }`
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
