import { useState } from "react";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isHome = pathname === "/";

  // Navbar becomes white when:
  // 1. We are on any page other than Home
  // 2. The full-screen menu is open
  const showDark = !isHome || isMenuOpen;

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
      <>
        {/* Navbar */}
        <nav
            className={`fixed top-0 left-0 z-50 w-full px-6 py-5 transition-colors duration-300 ${
                showDark ? "bg-white" : "bg-transparent"
            }`}
        >
          <div className="mx-auto flex w-full max-w-[1536px] items-center justify-between md:px-10 lg:px-36">

            {/* Logo */}
            <Link
                to="/"
                onClick={closeMenu}
                className="relative z-50 shrink-0"
            >
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

            {/* Right Side */}
            <div className="flex shrink-0 items-center gap-3">

              {/* Become a Driver */}
              <Link
                  to="/become-a-driver"
                  onClick={closeMenu}
                  className="hidden whitespace-nowrap rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 md:flex"
              >
                Become a Driver
              </Link>

              {/* Menu Button */}
              <button
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  className={`relative z-50 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition ${
                      showDark
                          ? "bg-black text-white hover:bg-neutral-800"
                          : "bg-white text-black hover:bg-neutral-200"
                  }`}
                  aria-label={
                    isMenuOpen ? "Close menu" : "Open menu"
                  }
                  aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? (
                    <X size={22} strokeWidth={2} />
                ) : (
                    <Menu size={22} strokeWidth={2} />
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Full Screen Menu */}
        <div
            className={`fixed inset-0 z-40 bg-white transition-all duration-500 ${
                isMenuOpen
                    ? "visible opacity-100"
                    : "invisible opacity-0"
            }`}
        >
          <div className="flex h-full w-full flex-col overflow-y-auto px-6 pb-10 pt-32 md:px-10 lg:px-36">

            {/* Menu Links */}
            <div className="flex flex-col gap-5 md:gap-6">

              {navLinks.map((link) => (
                  <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={closeMenu}
                      className={({ isActive }) =>
                          `font-InterTight text-5xl font-bold tracking-tight transition md:text-7xl ${
                              isActive
                                  ? "text-[#ffcc00]"
                                  : "text-black hover:opacity-50"
                          }`
                      }
                  >
                    {link.label}
                  </NavLink>
              ))}

            </div>
          </div>
        </div>
      </>
  );
};

export default Navbar;