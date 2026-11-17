import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AuthContext } from "./auth-context";
import {
  SESSION_KEY,
  clearSession,
  loadSession,
  loginRequest,
  saveSession,
} from "../services/authService";
import type { Session } from "../types/auth";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [notice, setNotice] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    const next = await loginRequest(email, password);
    saveSession(next);
    setNotice(null);
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const clearNotice = useCallback(() => setNotice(null), []);

  // Sign out automatically when the session runs out
  useEffect(() => {
    if (!session) return;

    const expire = () => {
      clearSession();
      setSession(null);
      setNotice("Your session expired. Please sign in again.");
    };

    const timer = window.setTimeout(
      expire,
      Math.max(session.expiresAt - Date.now(), 0)
    );

    // Also check when the tab becomes visible again (e.g. laptop woke from sleep)
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() >= session.expiresAt) {
        expire();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [session]);

  // Signing out in one tab signs out every open tab
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SESSION_KEY) setSession(loadSession());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(
    () => ({ session, notice, login, logout, clearNotice }),
    [session, notice, login, logout, clearNotice]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};