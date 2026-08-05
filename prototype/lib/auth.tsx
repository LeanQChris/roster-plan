"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";

export const DEMO_EMAIL = "superadmin@gmail.com";
export const DEMO_PASSWORD = "superadmin";

export interface AuthUser {
  email: string;
  name: string;
  role: "super_admin";
}

export interface SignInResult {
  ok: boolean;
  error?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  signIn: (email: string, password: string) => SignInResult;
  signOut: () => void;
}

const STORAGE_KEY = "roster.session";

type Listener = () => void;
const listeners = new Set<Listener>();
let cachedUser: AuthUser | null | undefined;

function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    return parsed?.email === DEMO_EMAIL && parsed?.role === "super_admin"
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function getSnapshot(): AuthUser | null {
  if (cachedUser === undefined) cachedUser = readStoredUser();
  return cachedUser;
}

function getServerSnapshot(): AuthUser | null {
  return null;
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const signIn = useCallback(
    (email: string, password: string): SignInResult => {
      const normalized = email.trim().toLowerCase();
      if (normalized !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
        return { ok: false, error: "Invalid email or password." };
      }
      const session: AuthUser = {
        email: DEMO_EMAIL,
        name: "Bishal Adhikari",
        role: "super_admin",
      };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } catch {
        // storage unavailable — keep in-memory session only
      }
      cachedUser = session;
      emitChange();
      return { ok: true };
    },
    [],
  );

  const signOut = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    cachedUser = null;
    emitChange();
  }, []);

  const value = useMemo(
    () => ({ user, signIn, signOut }),
    [user, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}