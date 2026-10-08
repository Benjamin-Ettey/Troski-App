import { useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const MainLayout = () => {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  // Every new page starts at the top
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Sections fade up as they scroll into view (the Home hero has its own animation)
  useLayoutEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>(
      "main section:not(#Hero)"
    );
    sections.forEach((section) => section.classList.add("reveal"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className={`flex-1 ${isHome ? "" : "pt-24"}`}>
        <div key={pathname} className="page-transition">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;