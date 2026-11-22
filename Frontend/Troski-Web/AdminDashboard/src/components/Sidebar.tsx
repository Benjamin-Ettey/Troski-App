import { NavLink } from "react-router-dom";
import {
  ClipboardList,
  LayoutDashboard,
  ScrollText,
  Users,
  X,
} from "lucide-react";
import logo from "../assets/logo.svg";

const navItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/applications", label: "Applications", icon: ClipboardList, end: false },
  { to: "/drivers", label: "Drivers", icon: Users, end: false },
  { to: "/audit-logs", label: "Audit logs", icon: ScrollText, end: false },
];

interface SidebarProps {
  isOpen: boolean; // mobile drawer
  isCollapsed: boolean; // desktop icon-only mode
  onClose: () => void;
}

const Sidebar = ({ isOpen, isCollapsed, onClose }: SidebarProps) => {
  return (
    <>
      {/* Dim overlay behind the drawer on small screens */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-ink text-white transition-[width,transform,visibility] duration-300 ease-out lg:visible lg:translate-x-0 ${
          isCollapsed ? "lg:w-[72px]" : ""
        } ${isOpen ? "visible translate-x-0" : "invisible -translate-x-full"}`}
      >
        {/* Header */}
        <div
          className={`flex h-16 items-center justify-between px-5 ${
            isCollapsed ? "lg:justify-center lg:px-0" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Troski"
              width={80}
              height={32}
              className={`h-8 w-auto ${isCollapsed ? "lg:hidden" : ""}`}
            />
            <span
              className={`rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium text-white/70 ${
                isCollapsed ? "lg:hidden" : ""
              }`}
            >
              Admin
            </span>

            {/* Small mark shown only when collapsed */}
            <img
              src="/favicon.svg"
              alt=""
              aria-hidden="true"
              width={32}
              height={32}
              className={`hidden size-8 ${isCollapsed ? "lg:block" : ""}`}
            />
          </div>

          <button
            onClick={onClose}
            aria-label="Close menu"
            className="cursor-pointer rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 flex flex-col gap-1 px-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <div key={to} className="group relative">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand transition-opacity ${
                        isActive ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <span className="flex w-6 shrink-0 justify-center">
                      <Icon size={18} strokeWidth={1.75} />
                    </span>
                    <span
                      className={`whitespace-nowrap transition-opacity duration-200 ${
                        isCollapsed ? "lg:opacity-0" : ""
                      }`}
                    >
                      {label}
                    </span>
                  </>
                )}
              </NavLink>

              {/* Tooltip: only when collapsed on desktop */}
              <span
                role="tooltip"
                className={`pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-ink px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 ${
                  isCollapsed
                    ? "lg:block lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
                    : ""
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;