"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { hash, COMPANY_COLORS } from "./data";
import type { AuditEntry, Company, CompanyStatus } from "./data";
import {
  setCompanyStatus as setCompanyStatusAction,
  deleteCompany as deleteCompanyAction,
} from "@/lib/supabase/admin-actions";

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
  | { type: "hydrate"; companies: Company[]; audit: AuditEntry[] }
  | { type: "patchCompanyStatus"; id: string; status: CompanyStatus; updatedAt: string }
  | { type: "removeCompany"; id: string }
  | { type: "addAudit"; entry: AuditEntry }
  | { type: "addToast"; toast: Toast }
  | { type: "dismissToast"; id: string };

const reducer = (state: AdminState, action: AdminAction): AdminState => {
  switch (action.type) {
    case "hydrate":
      return { ...state, companies: action.companies, audit: action.audit };
    case "patchCompanyStatus":
      return {
        ...state,
        companies: state.companies.map((c) =>
          c.id === action.id
            ? { ...c, status: action.status, updatedAt: action.updatedAt }
            : c,
        ),
      };
    case "removeCompany":
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
  loading: boolean;
  setCompanyStatus: (id: string, status: CompanyStatus) => Promise<{ ok: boolean; error?: string }>;
  deleteCompany: (id: string) => Promise<{ ok: boolean; error?: string }>;
  pushToast: (toast: { tone: Toast["tone"]; message: string; detail?: string }) => void;
  dismissToast: (id: string) => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

let seq = 0;
const nextId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${(seq += 1).toString(36)}`;

interface CompanyRow {
  id: string;
  name: string;
  slug: string;
  status: CompanyStatus;
  plan: Company["plan"];
  created_at: string;
  updated_at: string;
}

interface AuditLogRow {
  id: string;
  actor: string;
  actor_role: AuditEntry["actorRole"];
  action: string;
  tone: AuditEntry["tone"];
  resource: string;
  resource_id: string;
  company_id: string | null;
  company_name: string;
  ip: string | null;
  created_at: string;
}

const fromAuditRow = (row: AuditLogRow): AuditEntry => ({
  id: row.id,
  timestamp: row.created_at,
  actor: row.actor,
  actorRole: row.actor_role,
  action: row.action,
  tone: row.tone,
  resource: row.resource,
  resourceId: row.resource_id,
  companyId: row.company_id,
  company: row.company_name,
  ip: row.ip,
});

async function fetchAdminData(): Promise<{ companies: Company[]; audit: AuditEntry[] }> {
  const supabase = createClient();
  const [
    { data: companyRows },
    { data: peopleRows },
    { data: teamRows },
    { data: shiftRows },
    { data: adminProfileRows },
    { data: auditRows },
  ] = await Promise.all([
    supabase.from("companies").select("id, name, slug, status, plan, created_at, updated_at"),
    supabase.from("people").select("id, company_id, role"),
    supabase.from("teams").select("id, company_id"),
    supabase.from("shifts").select("id, company_id"),
    supabase
      .from("profiles")
      .select("id, company_id, role, email")
      .eq("role", "company_admin"),
    supabase
      .from("platform_audit_log")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const people = (peopleRows ?? []) as { company_id: string; role: string }[];
  const teams = (teamRows ?? []) as { company_id: string }[];
  const shifts = (shiftRows ?? []) as { company_id: string }[];
  const adminProfiles = (adminProfileRows ?? []) as { company_id: string | null; email: string }[];

  const contactEmailByCompany = new Map<string, string>();
  for (const p of adminProfiles) {
    if (p.company_id && !contactEmailByCompany.has(p.company_id)) {
      contactEmailByCompany.set(p.company_id, p.email);
    }
  }

  const companies = ((companyRows ?? []) as CompanyRow[]).map((row): Company => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    plan: row.plan,
    contactEmail: contactEmailByCompany.get(row.id),
    members: people.filter((p) => p.company_id === row.id).length,
    teams: teams.filter((t) => t.company_id === row.id).length,
    managers: people.filter((p) => p.company_id === row.id && p.role === "manager").length,
    shifts: shifts.filter((s) => s.company_id === row.id).length,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    color: COMPANY_COLORS[hash(row.id) % COMPANY_COLORS.length],
  }));

  const audit = ((auditRows ?? []) as AuditLogRow[]).map(fromAuditRow);

  return { companies, audit };
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { companies: [], audit: [], toasts: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { companies, audit } = await fetchAdminData();
        if (cancelled) return;
        dispatch({ type: "hydrate", companies, audit });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setCompanyStatus = useCallback(
    async (id: string, status: CompanyStatus): Promise<{ ok: boolean; error?: string }> => {
      const result = await setCompanyStatusAction(id, status);
      if (!result.ok) return { ok: false, error: result.error };
      dispatch({
        type: "patchCompanyStatus",
        id,
        status: result.status,
        updatedAt: result.updatedAt,
      });
      dispatch({ type: "addAudit", entry: result.auditEntry });
      return { ok: true };
    },
    [],
  );

  const deleteCompany = useCallback(
    async (id: string): Promise<{ ok: boolean; error?: string }> => {
      const result = await deleteCompanyAction(id);
      if (!result.ok) return { ok: false, error: result.error };
      dispatch({ type: "removeCompany", id });
      dispatch({ type: "addAudit", entry: result.auditEntry });
      return { ok: true };
    },
    [],
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
      loading,
      setCompanyStatus,
      deleteCompany,
      pushToast,
      dismissToast,
    }),
    [state, loading, setCompanyStatus, deleteCompany, pushToast, dismissToast],
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
