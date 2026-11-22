import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, ArrowUpRight } from "lucide-react";
import logo from "../assets/logo.svg";

const menuLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/services", label: "Services" },
  { to: "/faqs", label: "FAQs" },
  { to: "/contact", label: "Contact" },
  { to: "/terms", label: "Terms & Privacy" },
];

const Navbar = () => {
  const { pathname } = useLocation();

  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(
      () => window.scrollY > 40
  );

  const isMenuOpen = openedAt === pathname;
  const isHome = pathname === "/";
  const showDark = !isHome || isMenuOpen || isScrolled;

  const closeMenu = () => setOpenedAt(null);

  const toggleMenu = () => {
    setOpenedAt(isMenuOpen ? null : pathname);
  };

  // Handle navbar scroll appearance
  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Lock scrolling while menu is open
  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMenuOpen]);

  return (
      <>
        {/* NAVBAR */}
        <nav
            className={`fixed top-0 left-0 z-50 w-full px-6 py-2 transition-all duration-300 ${
                showDark ? "bg-[#FAF9F6]" : "bg-transparent"
            } ${isScrolled && !isMenuOpen ? "shadow-sm" : ""}`}
        >
          <div className="mx-auto flex w-full max-w-[1536px] items-center justify-between md:px-10 lg:px-36">
            <Link
                to="/"
                onClick={closeMenu}
                className="relative z-50 shrink-0"
            >
              <img
                  src={logo}
                  alt="Troski Logo"
                  width={96}
                  height={48}
                  className="invert bottom-0"
              />
            </Link>

            <div className="flex shrink-0 items-center gap-3">
              <Link
                  to="/become-a-driver"
                  onClick={closeMenu}
                  className="hidden whitespace-nowrap rounded-full bg-brand px-5 py-2 text-sm font-semibold text-black hover:text-white transition duration-300 hover:-translate-y-0.5 hover:bg-black active:scale-95 md:flex"
              >
                Become a Driver
              </Link>

              <button
                  onClick={toggleMenu}
                  className="relative z-50 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center text-black transition duration-300 hover:opacity-60 active:scale-90"
                  aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={isMenuOpen}
                  aria-controls="troski-menu"
              >
              <span className="relative block h-[22px] w-[22px]">
                <Menu
                    size={22}
                    strokeWidth={2}
                    className={`absolute inset-0 transition-all duration-300 ${
                        isMenuOpen
                            ? "rotate-90 opacity-0"
                            : "rotate-0 opacity-100"
                    }`}
                />

                <X
                    size={22}
                    strokeWidth={2}
                    className={`absolute inset-0 transition-all duration-300 ${
                        isMenuOpen
                            ? "rotate-0 opacity-100"
                            : "-rotate-90 opacity-0"
                    }`}
                />
              </span>
              </button>
            </div>
          </div>
        </nav>

        {/* FULL SCREEN MENU */}
        <div
            id="troski-menu"
            aria-hidden={!isMenuOpen}
            className={`fixed inset-0 z-40 overflow-y-auto bg-[#FAF9F6] transition-all duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${
                isMenuOpen
                    ? "visible translate-y-0"
                    : "invisible -translate-y-full"
            }`}
        >
          <div className="mx-auto flex min-h-full w-full max-w-[1536px] flex-col px-6 pb-12 pt-28 md:px-10 lg:px-36">

            {/* NAVIGATION LINKS */}
            <div
                className={`w-full rounded-xl md:bg-black/2.5  p-6 transition-all duration-500 ease-out sm:p-8 md:p-10 ${
                    isMenuOpen
                        ? "translate-y-0 opacity-100"
                        : "translate-y-8 opacity-0"
                }`}
                style={{
                  transitionDelay: isMenuOpen ? "250ms" : "0ms",
                }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {menuLinks.map((link, index) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={closeMenu}
                        style={{
                          transitionDelay: isMenuOpen
                              ? `${300 + index * 60}ms`
                              : "0ms",
                        }}
                        className={({ isActive }) =>
                            `group/link flex items-center justify-between gap-2 px-3 py-5 transition-all duration-300 hover:px-5 ${
                                isMenuOpen
                                    ? "translate-y-0 opacity-100"
                                    : "translate-y-5 opacity-0"
                            } ${
                                isActive ? "text-brand" : "text-ink"
                            }`
                        }
                    >
                  <span className="text-md font-semibold tracking-tight transition-colors duration-300 group-hover/link:text-brand md:text-base">
                    {link.label}
                  </span>

                      <ArrowUpRight
                          size={17}
                          strokeWidth={1.7}
                          className="shrink-0 -translate-x-1 translate-y-1 opacity-0 transition-all duration-300 group-hover/link:translate-x-0 group-hover/link:translate-y-0 group-hover/link:opacity-100"
                      />
                    </NavLink>
                ))}

                {/* BECOME A DRIVER - only shown below md, where the navbar button is hidden */}
                <NavLink
                    to="/become-a-driver"
                    onClick={closeMenu}
                    style={{
                      transitionDelay: isMenuOpen
                          ? `${300 + menuLinks.length * 60}ms`
                          : "0ms",
                    }}
                    className={({ isActive }) =>
                        `group/link flex items-center justify-between gap-2 px-3 py-5 transition-all duration-300 hover:px-5 md:hidden ${
                            isMenuOpen
                                ? "translate-y-0 opacity-100"
                                : "translate-y-5 opacity-0"
                        } ${
                            isActive ? "text-brand" : "text-ink"
                        }`
                    }
                >
                  <span className="text-md font-semibold tracking-tight transition-colors duration-300 group-hover/link:text-brand md:text-base">
                    Become a Driver
                  </span>

                  <ArrowUpRight
                      size={17}
                      strokeWidth={1.7}
                      className="shrink-0 -translate-x-1 translate-y-1 opacity-0 transition-all duration-300 group-hover/link:translate-x-0 group-hover/link:translate-y-0 group-hover/link:opacity-100"
                  />
                </NavLink>
              </div>
            </div>

            {/* BOTTOM AREA */}
            <div className="mt-auto flex flex-col gap-3 border-t border-black/10 pt-6 mt-14 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink/50">
                Moving around should be simpler.
              </p>

              <Link
                  to="/contact"
                  onClick={closeMenu}
                  className="w-fit text-sm font-semibold text-ink transition-colors hover:text-brand"
              >
                Have a question? Talk to us <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </div>
      </>
  );
};

export default Navbar;