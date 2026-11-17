import { LogOut } from "lucide-react";
import useAuth from "../hooks/useAuth";

const Overview = () => {
  const { session, logout } = useAuth();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-ink/60">Signed in as {session?.admin.email}</p>

      <button
        onClick={logout}
        className="mt-8 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-hover"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </main>
  );
};

export default Overview;