import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between px-6 py-4">
      <Link to="/" className="font-bold text-lg">Troski</Link>
      <div className="flex gap-6 text-sm">
        <Link to="/about">About</Link>
        <Link to="/how-it-works">How It Works</Link>
        <Link to="/services">Services</Link>
        <Link to="/become-a-driver">Become a Driver</Link>
        <Link to="/faqs">FAQs</Link>
        <Link to="/contact">Contact</Link>
      </div>
    </nav>
  );
};

export default Navbar;