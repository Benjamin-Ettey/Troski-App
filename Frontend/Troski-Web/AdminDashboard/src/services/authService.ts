import type { Session } from "../types/auth";

export const SESSION_KEY = "troski_admin_session";

// TEMPORARY: mock login until the backend authentication endpoint is connected.
// Replace loginRequest with a real API call; the rest of the app won't change.
const DEMO_EMAIL = "admin@troski.test";
const DEMO_PASSWORD = "admin123";
const SESSION_LENGTH_MS = 30 * 60 * 1000; // 30 minutes

export async function loginRequest(
  email: string,
  password: string
): Promise<Session> {
  await new Promise((resolve) => setTimeout(resolve, 700)); // fake network delay

  if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    throw new Error("Incorrect email or password.");
  }

  return {
    token: "mock-token",
    expiresAt: Date.now() + SESSION_LENGTH_MS,
    admin: { id: "1", name: "Troski Admin", email: DEMO_EMAIL },
  };
}

export function saveSession(session: Session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* storage unavailable */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable */
  }
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw) as Session;
    if (session.expiresAt <= Date.now()) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}