/**
 * Dev utility — deletes all Supabase auth users and their associated email records.
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/delete-all-users.mjs
 * Or with a .env.local file loaded via dotenv:
 *   node --require dotenv/config scripts/delete-all-users.mjs
 *
 * CAUTION: Irreversible. Never run against production unless intentional.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await admin.auth.admin.listUsers();
if (error) { console.error("Failed to list users:", error.message); process.exit(1); }

const users = data.users;
if (users.length === 0) { console.log("No users found."); process.exit(0); }

console.log(`Found ${users.length} user(s). Deleting...`);

for (const user of users) {
  // Delete emails first (ON DELETE RESTRICT)
  await admin.from("emails").delete().eq("user_id", user.id);
  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) {
    console.error(`  ✗ ${user.email} — ${delErr.message}`);
  } else {
    console.log(`  ✓ ${user.email} deleted`);
  }
}

console.log("Done.");
