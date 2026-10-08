import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logo from "../assets/logo.svg";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/services", label: "Services" },
  { to: "/become-a-driver", label: "Become a Driver" },
  { to: "/faqs", label: "FAQs" },
  { to: "/contact", label: "Contact" },
  { to: "/terms", label: "Terms & Privacy" },
];

const Navbar = () => {
  const { pathname } = useLocation();

  // We remember which page the menu was opened on, so it also
  // closes by itself when the route changes (e.g. browser back button).
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(() => window.scrollY > 40);

  const isMenuOpen = openedAt === pathname;
  const isHome = pathname === "/";
  const showDark = !isHome || isMenuOpen || isScrolled;

  const closeMenu = () => setOpenedAt(null);
  const toggleMenu = () => setOpenedAt(isMenuOpen ? null : pathname);

  // Navbar turns solid once the page is scrolled
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // While the menu is open: lock page scroll and allow Escape to close
  useEffect(() => {
    if (!isMenuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenedAt(null);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 z-50 w-full px-6 py-5 transition-all duration-300 ${
          showDark ? "bg-white" : "bg-transparent"
        } ${isScrolled && !isMenuOpen ? "shadow-sm" : ""}`}
      >
        <div className="mx-auto flex w-full max-w-[1536px] items-center justify-between md:px-10 lg:px-36">
          <Link to="/" onClick={closeMenu} className="relative z-50 shrink-0">
            <img
              src={logo}
              alt="Troski Logo"
              width={96}
              height={64}
              className={`transition-all duration-300 ${
                showDark ? "invert" : ""
              }`}
            />
          </Link>

          <div className="flex shrink-0 items-center gap-3">
           <Link
              to="/become-a-driver"
              onClick={closeMenu}
                  className="hidden whitespace-nowrap rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-ink-hover active:scale-95 md:flex"
              >
                Become a Driver
           </Link>
            <button
              onClick={toggleMenu}
              className={`relative z-50 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition duration-300 active:scale-90 ${
                showDark
                  ? "bg-ink text-white hover:bg-ink-hover"
                  : "bg-white text-ink hover:bg-neutral-200"
              }`}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
            >
              <span className="relative block h-[22px] w-[22px]">
                <Menu
                  size={22}
                  strokeWidth={2}
                  className={`absolute inset-0 transition-all duration-300 ${
                    isMenuOpen ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
                  }`}
                />
                <X
                  size={22}
                  strokeWidth={2}
                  className={`absolute inset-0 transition-all duration-300 ${
                    isMenuOpen ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Full-screen menu: slides down from the top, and back up when closed */}
      <div
        aria-hidden={!isMenuOpen}
        className={`fixed inset-0 z-40 bg-white transition-all duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${
          isMenuOpen ? "visible translate-y-0" : "invisible -translate-y-full"
        }`}
      >
        <div className="flex h-full w-full flex-col overflow-y-auto px-6 pb-10 pt-28 md:px-10 lg:px-36">
          <div className="flex flex-col gap-1 md:gap-2">
            {navLinks.map((link, index) => (
              <div
                key={link.to}
                className={`transition-all duration-500 ease-out ${
                  isMenuOpen
                    ? "translate-y-0 opacity-100"
                    : "translate-y-6 opacity-0"
                }`}
                style={{
                  transitionDelay: isMenuOpen ? `${250 + index * 60}ms` : "0ms",
                }}
              >
                <NavLink
                  to={link.to}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `inline-block py-2 text-2xl font-semibold tracking-tight transition-opacity md:text-3xl ${
                      isActive ? "text-brand" : "text-ink hover:opacity-50"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;