import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Sidebar from "../components/Sidebar";
import useAuth from "../hooks/useAuth";

const COLLAPSED_KEY = "troski_admin_sidebar_collapsed";

const titles: [string, string][] = [
  ["/applications", "Applications"],
  ["/drivers", "Drivers"],
  ["/audit-logs", "Audit logs"],
];

const getTitle = (pathname: string) =>
  titles.find(([path]) => pathname.startsWith(path))?.[1] ?? "Overview";

const DashboardLayout = () => {
  const { pathname } = useLocation();
  const { session, logout } = useAuth();

  // Mobile drawer: remember which page it was opened on, so it closes
  // by itself whenever the route changes.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const isSidebarOpen = openedAt === pathname;

  // Desktop collapse state, remembered between visits
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
  };

  const title = getTitle(pathname);
  const initial = (session?.admin.name ?? "A").charAt(0).toUpperCase();

  useEffect(() => {
    document.title = `${title} | Troski Admin`;
  }, [title]);

  // While the drawer is open: lock page scroll, close on Escape,
  // and close if the window grows to desktop size.
  useEffect(() => {
    if (!isSidebarOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenedAt(null);
    };
    const query = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setOpenedAt(null);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    query.addEventListener("change", onChange);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
      query.removeEventListener("change", onChange);
    };
  }, [isSidebarOpen]);

  return (
    <div className="min-h-svh">
      <Sidebar
        isOpen={isSidebarOpen}
        isCollapsed={isCollapsed}
        onClose={() => setOpenedAt(null)}
      />

      <div
        className={`transition-[padding] duration-300 ease-out ${
          isCollapsed ? "lg:pl-[72px]" : "lg:pl-64"
        }`}
      >
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-ink/10 bg-white px-4 md:px-8">
          <div className="flex items-center gap-3">
            {/* Phones and tablets: open the drawer */}
            <button
              onClick={() => setOpenedAt(pathname)}
              aria-label="Open menu"
              className="-ml-2 cursor-pointer rounded-lg p-2 transition hover:bg-ink/5 lg:hidden"
            >
              <Menu size={22} />
            </button>

            {/* Desktop: collapse or expand the sidebar */}
            <button
              onClick={toggleCollapsed}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!isCollapsed}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="-ml-2 hidden cursor-pointer rounded-lg p-2 text-ink/60 transition hover:bg-ink/5 hover:text-ink lg:block"
            >
              {isCollapsed ? (
                <PanelLeftOpen size={20} />
              ) : (
                <PanelLeftClose size={20} />
              )}
            </button>

            <h1 className="text-lg font-semibold">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-ink">
                {initial}
              </span>
              <span className="hidden text-sm font-medium md:block">
                {session?.admin.name}
              </span>
            </div>

            <button
              onClick={logout}
              aria-label="Sign out"
              title="Sign out"
              className="cursor-pointer rounded-lg p-2 text-ink/60 transition hover:bg-ink/5 hover:text-ink"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main
          key={pathname}
          className="animate-fade-up px-4 py-8 motion-reduce:animate-none md:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;