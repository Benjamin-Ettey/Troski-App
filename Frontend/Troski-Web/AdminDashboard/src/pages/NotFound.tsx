import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-5xl font-bold">404</h1>
      <p className="text-ink/60">That page doesn't exist.</p>
      <Link
        to="/"
        className="rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-hover"
      >
        Back to dashboard
      </Link>
    </main>
  );
};

export default NotFound;