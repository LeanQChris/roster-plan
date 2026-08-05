"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";
import type { ReactNode } from "react";
import { seedAudit, seedCompanies, ts } from "./data";
import type { AuditEntry, AuditTone, Company, CompanyStatus } from "./data";
import { useAuth } from "./auth";

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

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, {
    companies: seedCompanies,
    audit: seedAudit,
    toasts: [],
  });

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