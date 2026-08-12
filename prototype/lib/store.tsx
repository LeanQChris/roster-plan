"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";
import type { ReactNode } from "react";
import { seedAudit, ts, COMPANY_COLORS } from "./data";
import type { AuditEntry, AuditTone, Company, CompanyStatus } from "./data";
import { useAuth, readAccounts } from "./auth";
import type { RegisteredAdmin } from "./auth";

export interface Toast {
  id: string;
  tone: "success" | "danger" | "neutral";
  message: string;
  detail?: string;
}

interface AdminState {
  companies: Company[];
  audit: AuditEntry[];
  toasts: Toast[];
}

type AdminAction =
  | { type: "setCompanyStatus"; id: string; status: CompanyStatus }
  | { type: "deleteCompany"; id: string }
  | { type: "addAudit"; entry: AuditEntry }
  | { type: "addToast"; toast: Toast }
  | { type: "dismissToast"; id: string };

const reducer = (state: AdminState, action: AdminAction): AdminState => {
  switch (action.type) {
    case "setCompanyStatus":
      return {
        ...state,
        companies: state.companies.map((c) =>
          c.id === action.id
            ? { ...c, status: action.status, updatedAt: ts(0) }
            : c,
        ),
      };
    case "deleteCompany":
      return {
        ...state,
        companies: state.companies.filter((c) => c.id !== action.id),
      };
    case "addAudit":
      return { ...state, audit: [action.entry, ...state.audit] };
    case "addToast":
      return { ...state, toasts: [...state.toasts, action.toast] };
    case "dismissToast":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.id),
      };
  }
};

interface AdminContextValue extends AdminState {
  setCompanyStatus: (id: string, status: CompanyStatus) => void;
  deleteCompany: (id: string) => void;
  recordAudit: (partial: {
    action: string;
    tone: AuditTone;
    resource: string;
    resourceId: string;
    companyId: string;
    company: string;
  }) => void;
  pushToast: (toast: { tone: Toast["tone"]; message: string; detail?: string }) => void;
  dismissToast: (id: string) => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

let seq = 0;
const nextId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${(seq += 1).toString(36)}`;

const hash = (s: string) => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
};

const slugify = (name: string) =>
  name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

const readStored = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return (JSON.parse(raw) as T) ?? fallback;
  } catch {
    return fallback;
  }
};

// Real numbers come from the company console data this browser holds.
// Company data is single-workspace per browser in the prototype.
const liveStats = () => {
  const people = readStored<{ role: string }[]>("roster.people", []);
  const teams = readStored<unknown[]>("roster.teams", []);
  const shifts = readStored<unknown[]>("roster.shifts", []);
  return {
    members: people.length,
    teams: teams.length,
    managers: people.filter((p) => p.role === "manager").length,
    shifts: shifts.length,
  };
};

const regId = (email: string) =>
  `reg_${email.toLowerCase().replace(/[^a-z0-9]/g, "")}`;

// Registered companies come from real signups (roster.accounts in localStorage).
const registeredToCompany = (a: RegisteredAdmin): Company => ({
  id: regId(a.email),
  name: a.company,
  slug: slugify(a.company),
  status: "active",
  region: "us-east",
  plan: "free",
  contactEmail: a.email,
  ...liveStats(),
  createdAt: a.createdAt,
  updatedAt: a.createdAt,
  color: COMPANY_COLORS[hash(a.email) % COMPANY_COLORS.length],
});

const initialCompanies = (): Company[] => readAccounts().map(registeredToCompany);

const initialAudit = (): AuditEntry[] => [
  ...readAccounts().map(
    (a): AuditEntry => ({
      id: `evt_reg_${regId(a.email)}`,
      timestamp: a.createdAt,
      actor: a.email,
      actorRole: "company_admin",
      action: "company.registration",
      tone: "success",
      resource: a.company,
      resourceId: `company:${regId(a.email)}`,
      companyId: regId(a.email),
      company: a.company,
      ip: "198.51.100.23",
    }),
  ),
  ...seedAudit,
];

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    companies: initialCompanies(),
    audit: initialAudit(),
    toasts: [],
  }));

  const setCompanyStatus = useCallback(
    (id: string, status: CompanyStatus) =>
      dispatch({ type: "setCompanyStatus", id, status }),
    [],
  );

  const deleteCompany = useCallback(
    (id: string) => dispatch({ type: "deleteCompany", id }),
    [],
  );

  const recordAudit = useCallback(
    (p: {
      action: string;
      tone: AuditTone;
      resource: string;
      resourceId: string;
      companyId: string;
      company: string;
    }) =>
      dispatch({
        type: "addAudit",
        entry: {
          id: nextId("evt"),
          timestamp: ts(0),
          actor: user?.email ?? "superadmin@gmail.com",
          actorRole: "super_admin",
          ip: "203.0.113.4",
          ...p,
        },
      }),
    [user],
  );

  const dismissToast = useCallback(
    (id: string) => dispatch({ type: "dismissToast", id }),
    [],
  );

  const pushToast = useCallback(
    (t: { message: string; tone?: Toast["tone"]; detail?: string }) =>
      dispatch({
        type: "addToast",
        toast: {
          id: nextId("tt"),
          tone: t.tone ?? "neutral",
          message: t.message,
          detail: t.detail,
        },
      }),
    [],
  );

  const value = useMemo<AdminContextValue>(
    () => ({
      ...state,
      setCompanyStatus,
      deleteCompany,
      recordAudit,
      pushToast,
      dismissToast,
    }),
    [state, setCompanyStatus, deleteCompany, recordAudit, pushToast, dismissToast],
  );

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within <AdminProvider>");
  return ctx;
}