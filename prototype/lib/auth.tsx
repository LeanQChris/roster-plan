"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";

export const DEMO_EMAIL = "superadmin@gmail.com";
export const DEMO_PASSWORD = "superadmin";

export const DEMO_MANAGER_EMAIL = "manager@gmail.com";
export const DEMO_MANAGER_PASSWORD = "manager123";

export const ADMINS_KEY = "roster.accounts";

export type AuthRole = "super_admin" | "company_admin" | "manager";

export interface AuthUser {
  email: string;
  name: string;
  role: AuthRole;
  company?: string;
}

export interface RegisteredAdmin {
  name: string;
  email: string;
  password: string;
  company: string;
  role: "company_admin";
  createdAt: string;
}

export interface SignInResult {
  ok: boolean;
  error?: string;
  user?: AuthUser;
}

export type RegisterInput = {
  email: string;
  password: string;
  company: string;
};

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  signIn: (email: string, password: string) => SignInResult;
  signOut: () => void;
  registerAdmin: (input: RegisterInput) => SignInResult;
}

const STORAGE_KEY = "roster.session";

function readAccounts(): RegisteredAdmin[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ADMINS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RegisteredAdmin[];
    return Array.isArray(parsed)
      ? parsed.filter((a) => a?.email && a?.password)
      : [];
  } catch {
    return [];
  }
}

type Listener = () => void;
const listeners = new Set<Listener>();
let cachedUser: AuthUser | null | undefined;

function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.email) return null;
    if (parsed.role === "super_admin") {
      return parsed.email.toLowerCase() === DEMO_EMAIL ? parsed : null;
    }
    if (parsed.role === "manager") {
      return parsed.email.toLowerCase() === DEMO_MANAGER_EMAIL ? parsed : null;
    }
    if (
      parsed.role === "company_admin" &&
      readAccounts().some((a) => a.email.toLowerCase() === parsed.email.toLowerCase())
    ) {
      return parsed;
    }
    return null;
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

function persistSession(session: AuthUser) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // storage unavailable — keep in-memory session only
  }
  cachedUser = session;
  emitChange();
}

function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // Guards against acting on the SSR-only `null` snapshot before the
  // client has synced with localStorage on hydration.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  const signIn = useCallback(
    (email: string, password: string): SignInResult => {
      const normalized = email.trim().toLowerCase();

      if (normalized === DEMO_EMAIL && password === DEMO_PASSWORD) {
        const session: AuthUser = {
          email: DEMO_EMAIL,
          name: "Bishal Adhikari",
          role: "super_admin",
        };
        persistSession(session);
        return { ok: true, user: session };
      }

      if (normalized === DEMO_MANAGER_EMAIL && password === DEMO_MANAGER_PASSWORD) {
        const session: AuthUser = {
          email: DEMO_MANAGER_EMAIL,
          name: "Team Manager",
          role: "manager",
        };
        persistSession(session);
        return { ok: true, user: session };
      }

      const account = readAccounts().find((a) => a.email === normalized);
      if (account && account.password === password) {
        const session: AuthUser = {
          email: account.email,
          name: account.name,
          role: account.role,
          company: account.company,
        };
        persistSession(session);
        return { ok: true, user: session };
      }

      return { ok: false, error: "Invalid email or password." };
    },
    [],
  );

  const registerAdmin = useCallback((input: RegisterInput): SignInResult => {
    const email = input.email.trim().toLowerCase();
    const company = input.company.trim();

    if (!email || !company || !input.password) {
      return { ok: false, error: "Please fill out every field." };
    }
    if (email === DEMO_EMAIL) {
      return { ok: false, error: "That email is already in use." };
    }
    if (readAccounts().some((a) => a.email === email)) {
      return { ok: false, error: "An admin with that email already exists." };
    }
    if (input.password.length < 8) {
      return { ok: false, error: "Password must be at least 8 characters." };
    }
    try {
      const admin: RegisteredAdmin = {
        name: displayNameFromEmail(email),
        email,
        password: input.password,
        company,
        role: "company_admin",
        createdAt: new Date().toISOString(),
      };
      window.localStorage.setItem(
        ADMINS_KEY,
        JSON.stringify([...readAccounts(), admin]),
      );
      // Spec: register auto-signs-in the new admin (docs/04-mvp-plan.md §Flow 1)
      persistSession({
        email,
        name: admin.name,
        role: admin.role,
        company: admin.company,
      });
    } catch {
      // storage unavailable — registration cannot persist
      return { ok: false, error: "Storage unavailable. Try again in a private tab." };
    }
    return { ok: true };
  }, []);

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
    () => ({ user, ready, signIn, signOut, registerAdmin }),
    [user, ready, signIn, signOut, registerAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}