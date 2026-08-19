export type CompanyStatus = "active" | "suspended";
export type CompanyPlan = "free" | "pro" | "enterprise";

export interface Company {
  id: string;
  name: string;
  slug: string;
  status: CompanyStatus;
  plan: CompanyPlan;
  contactEmail?: string;
  members: number;
  teams: number;
  managers: number;
  shifts: number;
  createdAt: string;
  updatedAt: string;
  color: string;
}

export type AuditTone = "neutral" | "success" | "danger" | "warning";

// Mirrors platform_audit_log 1:1 (supabase/migrations/0008_admin_platform_audit.sql).
// companyId/ip are nullable in the DB (company.deleted events set company_id
// to null; the trigger-inserted company.registration event has no IP).
export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: "super_admin" | "company_admin" | "system";
  action: string;
  tone: AuditTone;
  resource: string;
  resourceId: string;
  companyId: string | null;
  company: string;
  ip: string | null;
}

export const COMPANY_COLORS = [
  "#5e6ad2",
  "#3cbf7b",
  "#e09f2b",
  "#d25e6a",
  "#5f9ed2",
  "#9b6dd2",
  "#61b6b0",
  "#d2785e",
  "#8a9aa7",
];

export const hash = (s: string) => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
};
