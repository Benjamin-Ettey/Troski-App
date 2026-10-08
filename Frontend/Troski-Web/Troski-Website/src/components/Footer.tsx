import { Link } from "react-router-dom";
import logo from "../assets/logo.svg";

const linkClass =
  "text-white/70 transition-colors duration-200 hover:text-brand";

const Footer = () => {
  return (
    <footer className="w-full bg-ink text-white">
      <div className="mx-auto flex w-[90%] flex-col justify-between gap-10 py-12 md:w-[70%] md:flex-row md:py-16">
        <div className="flex flex-col gap-4">
          <Link to="/" className="w-24">
            <img src={logo} alt="Troski" width={96} height={64} />
          </Link>
          <p className="max-w-xs text-sm text-white/60">
            Modernizing tro-tro transport in Ghana through digital booking,
            payments, and trip verification.
          </p>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <span className="mb-1 font-semibold text-white">Company</span>
          <Link to="/about" className={linkClass}>About</Link>
          <Link to="/how-it-works" className={linkClass}>How It Works</Link>
          <Link to="/services" className={linkClass}>Services</Link>
          <Link to="/become-a-driver" className={linkClass}>Become a Driver</Link>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <span className="mb-1 font-semibold text-white">Support</span>
          <Link to="/faqs" className={linkClass}>FAQs</Link>
          <Link to="/contact" className={linkClass}>Contact</Link>
          <Link to="/terms" className={linkClass}>Terms & Privacy</Link>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto w-[90%] py-6 text-center text-xs text-white/50 md:w-[70%] md:text-left">
          &copy; {new Date().getFullYear()} Troski. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;