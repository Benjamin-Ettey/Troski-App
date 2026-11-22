import { createContext } from "react";
import type { Session } from "../types/auth";

export interface AuthContextValue {
  session: Session | null;
  notice: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearNotice: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);