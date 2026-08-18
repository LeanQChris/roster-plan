// One-time super_admin seed script. Creates an auth.users row via the
// service-role client; handle_new_user() (0003_auth_trigger.sql) reads
// user_metadata.intended_role and creates the matching profiles row
// automatically (company_id/person_id stay null for super_admin).
//
// Usage:
//   node --env-file=.env.local scripts/seed-super-admin.mjs <email> <password> [name]

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
      "Run with: node --env-file=.env.local scripts/seed-super-admin.mjs <email> <password> [name]",
  );
  process.exit(1);
}

const [email, password, name = "Super Admin"] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: node --env-file=.env.local scripts/seed-super-admin.mjs <email> <password> [name]");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { intended_role: "super_admin", name },
});

if (error) {
  console.error("Failed to create super admin:", error.message);
  process.exit(1);
}

console.log(`Super admin created: ${data.user?.email} (${data.user?.id})`);
