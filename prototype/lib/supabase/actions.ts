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
  const linkOptions = {
    redirectTo: `${origin}/auth/callback?next=/accept-invite`,
    data: {
      intended_role: input.role,
      company_id: profile.companyId,
      person_id: input.personId,
    },
  };
  let linkType: "invite" | "recovery" = "invite";
  let { data, error } = await admin.auth.admin.generateLink({
    type: linkType,
    email: input.email,
    options: linkOptions,
  });

  // A prior invite attempt may have already created (and partially
  // verified) the auth.users row for this email — generateLink({type:
  // "invite"}) rejects that with email_exists. Fall back to a recovery
  // link, which works for existing unconfirmed users and lands on the
  // same /accept-invite password-set flow.
  if (error?.code === "email_exists") {
    linkType = "recovery";
    ({ data, error } = await admin.auth.admin.generateLink({
      type: linkType,
      email: input.email,
      options: linkOptions,
    }));

    // handle_new_user() only fires on INSERT into auth.users. For an
    // existing user (this branch), that trigger never re-runs, so a
    // re-invite with a different role/company/person would otherwise
    // leave the stale profiles row in place. Sync it here explicitly.
    if (!error && data?.user) {
      const { error: profileError } = await admin
        .from("profiles")
        .update({
          role: input.role,
          company_id: profile.companyId,
          person_id: input.personId,
        })
        .eq("id", data.user.id);
      if (profileError) {
        return { ok: false, error: profileError.message };
      }
    }
  }

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to generate invite link." };
  }

  // Don't email Supabase's own action_link — visiting it (GET) verifies
  // and consumes the token immediately, so email security scanners that
  // prefetch links burn it before the invitee ever clicks. Instead, email
  // a link to our own confirm page, which only calls verifyOtp() on an
  // explicit user click (scanners follow GET redirects but don't submit
  // forms/click buttons), then forwards to /accept-invite.
  const confirmLink = `${origin}/auth/confirm?token_hash=${encodeURIComponent(
    data.properties!.hashed_token,
  )}&type=${linkType}&next=${encodeURIComponent("/accept-invite")}`;

  const sent = await sendInviteEmail(input.email, confirmLink, company?.name ?? "Roster");
  if (!sent.ok) {
    return { ok: false, error: sent.error ?? "Failed to send invite email." };
  }
  return { ok: true };
}
