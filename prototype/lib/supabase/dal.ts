import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./server";
import { homeForRole } from "@/lib/roles";
import type { AuthRole } from "@/lib/roles";

// Data Access Layer — centralizes auth/authorization checks for Server
// Components, Server Actions, and Route Handlers. cache()-wrapped so
// repeated calls during a single render pass don't re-hit Supabase.
//
// Uses auth.getUser() (not getSession()) because it revalidates the JWT
// against the Supabase Auth server — required for a real "secure" check.
// proxy.ts only does optimistic cookie-presence checks; this is the actual
// authorization boundary alongside RLS.

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
});

export interface Profile {
  id: string;
  companyId: string | null;
  personId: string | null;
  role: AuthRole;
  email: string;
  name: string;
}

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, company_id, person_id, role, email, name")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    companyId: data.company_id,
    personId: data.person_id,
    role: data.role,
    email: data.email,
    name: data.name,
  };
});

// Redirects to /login if unauthenticated, or to the caller's role-appropriate
// home if authenticated but not permitted. Returns the verified profile.
export async function requireRole(allowedRoles: AuthRole[]): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!allowedRoles.includes(profile.role)) redirect(homeForRole(profile.role));
  return profile;
}
