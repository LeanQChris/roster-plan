// Pure, server-safe role types/helpers shared by client (lib/auth.tsx) and
// server (lib/supabase/dal.ts) code. No "use client" directive here so it can
// be imported from Server Components/Actions without crossing the client
// boundary.

export type AuthRole = "super_admin" | "company_admin" | "manager" | "employee";

export function homeForRole(role: string | undefined): string {
  if (role === "super_admin") return "/admin";
  if (role === "manager") return "/manager/dashboard";
  if (role === "employee") return "/employee/dashboard";
  return "/dashboard";
}
