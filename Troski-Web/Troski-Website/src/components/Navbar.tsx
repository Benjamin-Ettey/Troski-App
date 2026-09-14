import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import logo from "../assets/logo.svg";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/services", label: "Services" },
  { to: "/become-a-driver", label: "Become a Driver" },
  { to: "/faqs", label: "FAQs" },
  { to: "/contact", label: "Contact" },
];

const Navbar = () => {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const showDark = !isHome || menuOpen;

  return (
    <section
      id="NavBar"
      className={`fixed top-0 left-0 w-full z-50 flex justify-center ${
        showDark ? "bg-white shadow-sm" : ""
      }`}
    >
      <div className="w-[95%] md:w-[70%] mt-4 md:mt-8 mb-4 md:mb-8 flex flex-col">
        <div className="flex flex-row items-center justify-between">
          <Link
            to="/"
            className="w-24 h-10 flex items-center justify-center"
            onClick={() => setMenuOpen(false)}
          >
            <img
              src={logo}
              alt="Troski Logo"
              width={96}
              height={64}
              className={showDark ? "invert" : ""}
            />
          </Link>

          <div className="w-64 h-10 flex flex-row md:justify-between justify-end items-center gap-2">
            <Link
              to="/become-a-driver"
              className="hidden md:flex hover:bg-white bg-[#ffcc00] font-medium text-base cursor-pointer justify-center items-center px-4 py-2 rounded-full"
            >
              Become a driver
            </Link>

            <button
              className="flex flex-col gap-2"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <div
                className={`w-8 h-0.5 transition-transform ${
                  showDark ? "bg-black" : "bg-white"
                } ${menuOpen ? "rotate-45 translate-y-[3px]" : ""}`}
              />
              <div
                className={`w-8 h-0.5 transition-transform ${
                  showDark ? "bg-black" : "bg-white"
                } ${menuOpen ? "-rotate-45 -translate-y-[3px]" : ""}`}
              />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="mt-6 flex flex-col gap-4 pb-4">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `text-lg font-medium ${
                    isActive ? "text-[#ffcc00]" : "text-black"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Navbar;