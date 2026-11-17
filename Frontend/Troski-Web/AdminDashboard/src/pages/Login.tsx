import { useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import logo from "../assets/logo.svg";
import useAuth from "../hooks/useAuth";

const inputClass =
  "h-12 w-full rounded-lg border border-ink/15 bg-white px-4 text-base outline-none transition placeholder:text-ink/35 focus:border-ink focus:ring-1 focus:ring-ink";

const Login = () => {
  const { session, login, notice, clearNotice } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Already signed in: skip the login page
  if (session) return <Navigate to={from} replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    clearNotice();
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Brand panel (large screens only) */}
      <div className="hidden flex-col justify-between bg-ink p-12 text-white lg:flex">
        <img src={logo} alt="Troski" width={96} height={64} />

        <div className="max-w-md">
          <h2 className="text-4xl font-bold leading-tight">
            Driver verification, all in one place.
          </h2>
          <p className="mt-4 text-white/60">
            Review applications, check documents and keep Troski's driver
            network trusted.
          </p>
        </div>

        <p className="text-sm text-white/40">
          &copy; {new Date().getFullYear()} Troski
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-up motion-reduce:animate-none">
          <img
            src={logo}
            alt="Troski"
            width={96}
            height={64}
            className="mb-10 invert lg:hidden"
          />

          <h1 className="text-3xl font-bold tracking-tight">Admin sign in</h1>
          <p className="mt-2 text-sm text-ink/60">
            Use your Troski admin account to continue.
          </p>

          {notice && (
            <div
              role="status"
              className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800"
            >
              {notice}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1.5 text-ink/50 transition hover:text-ink"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand text-base font-bold text-ink transition hover:bg-brand-dark active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;