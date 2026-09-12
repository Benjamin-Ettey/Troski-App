import { Outlet, Link } from "react-router-dom";

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <nav className="p-4">
        <Link to="/">Troski</Link>
      </nav>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="p-4 text-sm text-center">
        &copy; {new Date().getFullYear()} Troski
      </footer>
    </div>
  );
};

export default MainLayout;