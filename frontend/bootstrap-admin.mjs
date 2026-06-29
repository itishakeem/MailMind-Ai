#!/usr/bin/env node
/**
 * One-shot admin bootstrap script.
 *
 * Run:  node bootstrap-admin.mjs
 *
 * What it does:
 *  1. Applies the RBAC migration (011 + 012) via the Supabase Management API
 *     — if you supply a Personal Access Token (PAT).
 *  2. Falls back to printing the SQL + dashboard link if no PAT is set.
 *  3. Sets itzhakeem1725@gmail.com → role = 'super_admin'.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── Load env ────────────────────────────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, ".env.local");
let envVars = {};
try {
  readFileSync(envPath, "utf8").split("\n").forEach(line => {
    const [k, ...v] = line.split("=");
    if (k && !k.startsWith("#")) envVars[k.trim()] = v.join("=").trim();
  });
} catch {
  console.error("❌ Could not read frontend/.env.local");
  process.exit(1);
}

const SUPABASE_URL     = envVars["NEXT_PUBLIC_SUPABASE_URL"];
const SERVICE_ROLE_KEY = envVars["SUPABASE_SERVICE_ROLE_KEY"];
const ADMIN_EMAIL      = "itzhakeem1725@gmail.com";
const PROJECT_REF      = SUPABASE_URL?.match(/https:\/\/([^.]+)\./)?.[1] ?? "";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

// ── Migration SQL ────────────────────────────────────────────────────────────
const MIGRATION_SQL = `
-- 011: add is_admin (no-op if already applied)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- 012: replace with role TEXT for RBAC
ALTER TABLE public.users DROP COLUMN IF EXISTS is_admin;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role) WHERE role <> 'user';
`.trim();

// ── Supabase admin client ────────────────────────────────────────────────────
const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Try Management API (needs PAT) ───────────────────────────────────────────
async function applyMigrationViaManagementAPI(pat) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pat}`,
      },
      body: JSON.stringify({ query: MIGRATION_SQL }),
    }
  );
  return res.ok;
}

// ── Promote the user ─────────────────────────────────────────────────────────
async function promoteUser() {
  const { data, error } = await db
    .from("users")
    .update({ role: "super_admin" })
    .eq("email", ADMIN_EMAIL)
    .select("id, name, email, role")
    .single();
  return { data, error };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\nMailMind AI — Admin Bootstrap`);
  console.log(`Project : ${PROJECT_REF}`);
  console.log(`Target  : ${ADMIN_EMAIL}\n`);

  // ── Step 1: attempt migration ─────────────────────────────────────────────
  const PAT = process.env.SUPABASE_PAT ?? envVars["SUPABASE_PAT"];
  if (PAT) {
    process.stdout.write("Applying migrations via Management API… ");
    const ok = await applyMigrationViaManagementAPI(PAT);
    console.log(ok ? "✅ Done" : "❌ Failed (check PAT permissions)");
  }

  // ── Step 2: promote the user ─────────────────────────────────────────────
  const { data, error } = await promoteUser();

  if (!error && data) {
    console.log(`\n✅  Success!`);
    console.log(`   Name  : ${data.name}`);
    console.log(`   Email : ${data.email}`);
    console.log(`   Role  : ${data.role}`);
    console.log(`\n   Visit /admin to access the dashboard.\n`);
    return;
  }

  // ── Step 3: migration not applied yet — print SQL ─────────────────────────
  const needsMigration =
    error?.message?.includes('"role"') ||
    error?.message?.includes("role") ||
    error?.code === "42703" || // undefined column
    error?.code === "PGRST204"; // column not found

  if (needsMigration || error) {
    console.log("⚠️  The database migration hasn't been applied yet.");
    console.log("\nOption A — Paste this SQL in the Supabase SQL Editor:");
    console.log(`   https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new\n`);
    console.log("─".repeat(60));
    console.log(MIGRATION_SQL);
    console.log("─".repeat(60));
    console.log("\n   After running the SQL above, re-run this script:");
    console.log("   node bootstrap-admin.mjs\n");
    console.log("Option B — Provide your Supabase Personal Access Token:");
    console.log("   1. Go to https://supabase.com/dashboard/account/tokens");
    console.log("   2. Create a token, then run:");
    console.log("   SUPABASE_PAT=your_token node bootstrap-admin.mjs\n");
    if (error) {
      console.log(`Raw error: ${error.message ?? JSON.stringify(error)}\n`);
    }
  }
}

main().catch(err => {
  console.error("\n❌ Unexpected error:", err.message ?? err);
  process.exit(1);
});
