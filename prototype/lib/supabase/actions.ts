"use server";

import { headers } from "next/headers";
import { requireRole } from "@/lib/supabase/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendInviteEmail } from "@/lib/email";

export interface InviteEmployeeInput {
  email: string;
  personId: string;
  role: "employee" | "manager";
}

// Real email invite. Verifies the caller's role/company via the regular
// (RLS-scoped) server client BEFORE touching the service-role admin client —
// guards against confused-deputy misuse of the admin API.
//
// Uses generateLink() (mints the invite link, sends no email) instead of
// inviteUserByEmail() (which requires SMTP configured in the Supabase
// dashboard) — delivery instead goes through our own nodemailer transport
// (lib/email.ts), so no Supabase-side SMTP setup is required.
export async function inviteEmployee(
  input: InviteEmployeeInput,
): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireRole(["manager", "company_admin"]);
  if (!profile.companyId) {
    return { ok: false, error: "No company context for this account." };
  }

  const h = await headers();
  const host = h.get("host");
  const isLocal = host?.startsWith("localhost") || host?.startsWith("127.0.0.1");
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? (host ? `${isLocal ? "http" : "https"}://${host}` : "");

  const supabase = await createClient();
  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", profile.companyId)
    .single();

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email: input.email,
    options: {
      redirectTo: `${origin}/auth/callback?next=/accept-invite`,
      data: {
        intended_role: input.role,
        company_id: profile.companyId,
        person_id: input.personId,
      },
    },
  });

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to generate invite link." };
  }

  const sent = await sendInviteEmail(
    input.email,
    data.properties.action_link,
    company?.name ?? "Roster",
  );
  if (!sent.ok) {
    return { ok: false, error: sent.error ?? "Failed to send invite email." };
  }
  return { ok: true };
}
