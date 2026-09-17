import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="w-full border-t border-gray-200 mt-12">
      <div className="w-[90%] md:w-[70%] mx-auto py-10 flex flex-col md:flex-row justify-between gap-8">
        <div className="flex flex-col gap-2">
          <span className="font-bold text-lg">Troski</span>
          <p className="text-gray-600 text-sm max-w-xs">
            Modernizing tro-tro transport in Ghana through digital booking,
            payments, and trip verification.
          </p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <span className="font-semibold mb-1">Company</span>
          <Link to="/about" className="text-gray-600 hover:text-black">About</Link>
          <Link to="/how-it-works" className="text-gray-600 hover:text-black">How It Works</Link>
          <Link to="/services" className="text-gray-600 hover:text-black">Services</Link>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <span className="font-semibold mb-1">Support</span>
          <Link to="/faqs" className="text-gray-600 hover:text-black">FAQs</Link>
          <Link to="/contact" className="text-gray-600 hover:text-black">Contact</Link>
          <Link to="/terms" className="text-gray-600 hover:text-black">Terms & Privacy</Link>
        </div>
      </div>

      <div className="w-full text-center text-xs text-gray-400 pb-6">
        &copy; {new Date().getFullYear()} Troski. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;