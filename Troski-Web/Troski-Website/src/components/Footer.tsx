import { Link } from "react-router-dom";

const Footer = () => {
  return (
      <footer className="relative w-full bg-black border-t border-white/10 mt-12 overflow-hidden">
        {/* Main footer content */}
        <div className="relative z-10 w-[90%] max-w-[1536px] mx-auto pt-14 pb-8">
          <div className="flex flex-col  gap-12 md:flex-row md:justify-between">

            {/* Brand */}
            <div className="flex flex-col">
              <h2 className="text-white font-bold text-5xl">
                Troski
              </h2>
            </div>


            {/* Company */}

            <div className="flex flex-col gap-3 text-sm">
            <span className="text-white font-bold mb-1">
              Company
            </span>

              <Link
                  to="/about"
                  className="text-white/50 font-medium hover:text-white/90 transition-colors"
              >
                About
              </Link>

              <Link
                  to="/how-it-works"
                  className="text-white/50 font-medium hover:text-white/90 transition-colors"
              >
                How It Works
              </Link>

              <Link
                  to="/services"
                  className="text-white/50 font-medium hover:text-white/90 transition-colors"
              >
                Services
              </Link>
            </div>

            {/* Support */}
            <div className="flex flex-col gap-3 text-sm">
            <span className="text-white font-bold mb-1">
              Support
            </span>

              <Link
                  to="/faqs"
                  className="text-white/50 font-medium hover:text-white/90 transition-colors"
              >
                FAQs
              </Link>

              <Link
                  to="/contact"
                  className="text-white/50 font-medium hover:text-white/90 transition-colors"
              >
                Contact
              </Link>

              <Link
                  to="/terms"
                  className="text-white/50 font-medium hover:text-white/90 transition-colors"
              >
                Terms & Privacy
              </Link>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full border-t border-white/10 mt-14 pt-6">
            <p className="text-center md:text-left font-medium text-xs text-white/40">
              &copy; {new Date().getFullYear()} Troski. All rights reserved.
            </p>
          </div>
        </div>


      </footer>
  );
};

export default Footer;