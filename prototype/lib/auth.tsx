"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { homeForRole } from "@/lib/roles";
import type { AuthRole } from "@/lib/roles";
import { inviteEmployee as inviteEmployeeAction } from "@/lib/supabase/actions";

export type { AuthRole };
export { homeForRole };

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
  companyId: string | null;
  personId: string | null;
  /** Company display name, joined from companies.name. Undefined for super_admin. */
  company?: string;
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

export type RegisterEmployeeInput = {
  email: string;
  personId: string;
  name: string;
  role?: "employee" | "manager";
};

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  registerAdmin: (input: RegisterInput) => Promise<SignInResult>;
  registerEmployee: (
    input: RegisterEmployeeInput,
  ) => Promise<{ ok: boolean; error?: string }>;
  changePassword: (current: string, next: string) => Promise<SignInResult>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// One-time cutover: stale localStorage-based auth from the pre-Supabase
// prototype is dead weight — clear it so it can't collide with the new
// session model. Runs once per browser (marker key), only when a Supabase
// env var is present (i.e. this build has actually cut over).
const LEGACY_AUTH_KEYS = [
  "roster.session",
  "roster.accounts",
  "roster.employeeAccounts",
  "roster.passwordOverrides",
];
const CUTOVER_MARKER_KEY = "roster.supabaseCutoverDone";

function clearLegacyAuthStorage() {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
  try {
    if (window.localStorage.getItem(CUTOVER_MARKER_KEY)) return;
    LEGACY_AUTH_KEYS.forEach((key) => window.localStorage.removeItem(key));
    window.localStorage.setItem(CUTOVER_MARKER_KEY, "1");
  } catch {
    // storage unavailable — ignore
  }
}

async function loadAuthUser(): Promise<AuthUser | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, company_id, person_id, role, email, name, companies(name)")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    companyId: profile.company_id,
    personId: profile.person_id,
    company: (profile.companies as { name?: string } | null)?.name,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    clearLegacyAuthStorage();
    const supabase = createClient();

    let cancelled = false;
    loadAuthUser().then((u) => {
      if (cancelled) return;
      setUser(u);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      loadAuthUser().then((u) => {
        if (!cancelled) setUser(u);
      });
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<SignInResult> => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      return { ok: false, error: "Invalid email or password." };
    }
    const nextUser = await loadAuthUser();
    setUser(nextUser);
    if (!nextUser) {
      return { ok: false, error: "Signed in, but no profile found for this account." };
    }
    return { ok: true, user: nextUser };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const registerAdmin = useCallback(async (input: RegisterInput): Promise<SignInResult> => {
    const email = input.email.trim().toLowerCase();
    const company = input.company.trim();

    if (!email || !company || !input.password) {
      return { ok: false, error: "Please fill out every field." };
    }
    if (input.password.length < 8) {
      return { ok: false, error: "Password must be at least 8 characters." };
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: {
        data: { intended_role: "company_admin", company_name: company },
      },
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    if (!data.session) {
      // Email confirmation is required by the project's Auth settings —
      // no session yet, so we can't auto-sign-in.
      return {
        ok: false,
        error: "Account created. Check your email to confirm before signing in.",
      };
    }

    const nextUser = await loadAuthUser();
    setUser(nextUser);
    return { ok: true, user: nextUser ?? undefined };
  }, []);

  const registerEmployee = useCallback(
    async (input: RegisterEmployeeInput): Promise<{ ok: boolean; error?: string }> => {
      return inviteEmployeeAction({
        email: input.email.trim().toLowerCase(),
        personId: input.personId,
        role: input.role ?? "employee",
      });
    },
    [],
  );

  const changePassword = useCallback(
    async (current: string, next: string): Promise<SignInResult> => {
      if (!user) {
        return { ok: false, error: "You must be signed in." };
      }
      if (next.length < 8) {
        return { ok: false, error: "Password must be at least 8 characters." };
      }
      if (next === current) {
        return { ok: false, error: "New password must be different from the current one." };
      }

      const supabase = createClient();
      // Re-auth to validate the current password before allowing the change.
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      });
      if (reauthError) {
        return { ok: false, error: "Current password is incorrect." };
      }

      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true };
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, ready, signIn, signOut, registerAdmin, registerEmployee, changePassword }),
    [user, ready, signIn, signOut, registerAdmin, registerEmployee, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
