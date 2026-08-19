"use server";

import { headers } from "next/headers";
import { requireRole } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import type { AuditEntry, CompanyStatus } from "@/lib/data";

// Server actions for the super-admin console (lib/store.tsx). Mirrors
// inviteEmployee()'s pattern in actions.ts: verify role via the regular
// RLS-scoped server client, then mutate — no createAdminClient()/service-role
// key needed. companies_update/companies_delete RLS + is_super_admin()
// already grant a super_admin session full access to every table touched
// here (supabase/migrations/0002_companies_profiles.sql).

interface AuditLogRow {
  id: string;
  actor: string;
  actor_role: "super_admin" | "company_admin" | "system";
  action: string;
  tone: "neutral" | "success" | "danger" | "warning";
  resource: string;
  resource_id: string;
  company_id: string | null;
  company_name: string;
  ip: string | null;
  created_at: string;
}

function fromAuditRow(row: AuditLogRow): AuditEntry {
  return {
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
  };
}

async function clientIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

export async function setCompanyStatus(
  id: string,
  status: CompanyStatus,
): Promise<
  | { ok: true; status: CompanyStatus; updatedAt: string; auditEntry: AuditEntry }
  | { ok: false; error: string }
> {
  const profile = await requireRole(["super_admin"]);
  const supabase = await createClient();

  const { data: company, error: fetchError } = await supabase
    .from("companies")
    .select("name")
    .eq("id", id)
    .single();
  if (fetchError || !company) {
    return { ok: false, error: fetchError?.message ?? "Company not found." };
  }

  const { data: updated, error: updateError } = await supabase
    .from("companies")
    .update({ status })
    .eq("id", id)
    .select("status, updated_at")
    .single();
  if (updateError || !updated) {
    return { ok: false, error: updateError?.message ?? "Failed to update company." };
  }

  const { data: auditRow, error: auditError } = await supabase
    .from("platform_audit_log")
    .insert({
      actor: profile.email,
      actor_role: "super_admin",
      action: status === "suspended" ? "company.suspended" : "company.activated",
      tone: status === "suspended" ? "danger" : "success",
      resource: company.name,
      resource_id: `company:${id}`,
      company_id: id,
      company_name: company.name,
      ip: await clientIp(),
    })
    .select()
    .single();
  if (auditError || !auditRow) {
    return { ok: false, error: auditError?.message ?? "Failed to record audit entry." };
  }

  return {
    ok: true,
    status: updated.status,
    updatedAt: updated.updated_at,
    auditEntry: fromAuditRow(auditRow),
  };
}

export async function deleteCompany(
  id: string,
): Promise<{ ok: true; auditEntry: AuditEntry } | { ok: false; error: string }> {
  const profile = await requireRole(["super_admin"]);
  const supabase = await createClient();

  const { data: company, error: fetchError } = await supabase
    .from("companies")
    .select("name")
    .eq("id", id)
    .single();
  if (fetchError || !company) {
    return { ok: false, error: fetchError?.message ?? "Company not found." };
  }
  const companyName = company.name;

  const { error: deleteError } = await supabase.from("companies").delete().eq("id", id);
  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  const { data: auditRow, error: auditError } = await supabase
    .from("platform_audit_log")
    .insert({
      actor: profile.email,
      actor_role: "super_admin",
      action: "company.deleted",
      tone: "danger",
      resource: companyName,
      resource_id: `company:${id}`,
      company_id: null,
      company_name: companyName,
      ip: await clientIp(),
    })
    .select()
    .single();
  if (auditError || !auditRow) {
    return { ok: false, error: auditError?.message ?? "Failed to record audit entry." };
  }

  return { ok: true, auditEntry: fromAuditRow(auditRow) };
}
