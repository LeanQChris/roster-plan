import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client — BYPASSES RLS. Use only for:
//   - super_admin cross-company reads (see lib/store.tsx, Phase 5)
//   - supabase.auth.admin.inviteUserByEmail (invite flow)
//   - other explicit RLS-bypass operations
//
// Confused-deputy risk: every call site MUST verify the caller's role via
// the regular server client (lib/supabase/server.ts + lib/supabase/dal.ts)
// BEFORE touching this client. Never expose this client or its key to the
// browser — "server-only" import above enforces this at build time.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
