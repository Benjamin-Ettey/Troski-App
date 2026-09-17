import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "../../assets/images/logo.svg";

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <>
            {/* Navbar */}
            <nav className="fixed top-0 left-0 z-50 w-full px-6 py-5">
                <div className="mx-auto flex w-full max-w-[1536px] md:px-10 lg:px-36 items-center justify-between">

                    {/* Logo */}
                    <a href="/" className="relative z-50 shrink-0">
                        <img
                            src={logo}
                            alt="Troski Logo"
                            width={96}
                            height={64}
                        />
                    </a>

                    {/* Right Side */}
                    <div className="flex shrink-0 items-center gap-3">

                        {/* Become a Driver */}
                        <a
                            href="/become-a-driver"
                            className="whitespace-nowrap rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
                        >
                            Become a Driver
                        </a>

                        {/* Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="relative z-50 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-black text-white transition hover:bg-neutral-800"
                            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
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
                <div className="flex h-full w-full flex-col px-6 pt-32 md:px-10 lg:px-14">

                    {/* Menu Links */}
                    <div className="flex flex-col gap-6">

                        <a
                            href="/"
                            className="font-InterTight text-5xl font-bold tracking-tight transition hover:opacity-50 md:text-7xl"
                        >
                            Home
                        </a>

                        <a
                            href="/about"
                            className="font-InterTight text-5xl font-bold tracking-tight transition hover:opacity-50 md:text-7xl"
                        >
                            About
                        </a>

                        <a
                            href="/services"
                            className="font-InterTight text-5xl font-bold tracking-tight transition hover:opacity-50 md:text-7xl"
                        >
                            Services
                        </a>

                        <a
                            href="/contact"
                            className="font-InterTight text-5xl font-bold tracking-tight transition hover:opacity-50 md:text-7xl"
                        >
                            Contact
                        </a>

                    </div>

                </div>
            </div>
        </>
    );
};

export default Navbar;