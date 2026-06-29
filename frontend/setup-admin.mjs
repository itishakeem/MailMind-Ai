#!/usr/bin/env node
/**
 * One-shot admin setup script.
 *
 * Run:  node setup-admin.mjs
 *
 * What it does:
 *  1. Creates abdulhakeem7978@gmail.com as a confirmed auth user (password: mailmind).
 *  2. Waits for the DB trigger to insert the public.users row, then sets role = 'super_admin'.
 *  3. Downgrades itzhakeem1725@gmail.com back to role = 'user'.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── Load env ─────────────────────────────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, ".env.local");
let envVars = {};
try {
  readFileSync(envPath, "utf8").split("\n").forEach(line => {
    const [k, ...v] = line.split("=");
    if (k && !k.startsWith("#")) envVars[k.trim()] = v.join("=").trim();
  });
} catch {
  console.error("❌ Could not read .env.local");
  process.exit(1);
}

const SUPABASE_URL     = envVars["NEXT_PUBLIC_SUPABASE_URL"];
const SERVICE_ROLE_KEY = envVars["SUPABASE_SERVICE_ROLE_KEY"];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const ADMIN_EMAIL    = "abdulhakeem7978@gmail.com";
const ADMIN_PASSWORD = "mailmind";
const ADMIN_NAME     = "Abdul Hakeem";
const OLD_EMAIL      = "itzhakeem1725@gmail.com";

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Step 1: create or fetch the new admin auth user ──────────────────────────
async function ensureAuthUser() {
  // Try to create; if already exists Supabase returns an error we can handle.
  const { data, error } = await db.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
  });

  if (!error) {
    console.log(`  ✅ Auth user created  (id: ${data.user.id})`);
    return data.user.id;
  }

  if (error.message?.toLowerCase().includes("already been registered") ||
      error.message?.toLowerCase().includes("already exists") ||
      error.code === "email_exists") {
    // User already exists — fetch their id
    const { data: list, error: listErr } = await db.auth.admin.listUsers();
    if (listErr) throw listErr;
    const existing = list.users.find(u => u.email === ADMIN_EMAIL);
    if (!existing) throw new Error("User exists but could not be found in listUsers.");

    // Update password just in case
    await db.auth.admin.updateUserById(existing.id, { password: ADMIN_PASSWORD });
    console.log(`  ℹ️  Auth user already exists (id: ${existing.id}) — password updated.`);
    return existing.id;
  }

  throw error;
}

// ── Step 2: upsert the public.users row and set super_admin ─────────────────
async function ensurePublicUser(authId) {
  // The trigger may have already inserted the row; upsert handles both cases.
  const { error: upsertErr } = await db.from("users").upsert({
    id: authId,
    email: ADMIN_EMAIL,
    name: ADMIN_NAME,
    plan: "business",
    role: "super_admin",
  }, { onConflict: "id" });

  if (upsertErr) throw upsertErr;

  // Confirm the final state
  const { data, error } = await db
    .from("users")
    .select("id, name, email, plan, role")
    .eq("id", authId)
    .single();

  if (error) throw error;
  return data;
}

// ── Step 3: downgrade old user to 'user' ────────────────────────────────────
async function downgradeOldUser() {
  const { data, error } = await db
    .from("users")
    .update({ role: "user" })
    .eq("email", OLD_EMAIL)
    .select("id, email, role")
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const project = SUPABASE_URL?.match(/https:\/\/([^.]+)\./)?.[1] ?? "unknown";
  console.log(`\nMailMind AI — Admin Setup`);
  console.log(`Project : ${project}\n`);

  // 1. Create/fetch admin auth user
  process.stdout.write("1. Creating admin auth user… ");
  const authId = await ensureAuthUser();

  // 2. Upsert public.users row + set role
  process.stdout.write("2. Setting super_admin role… ");
  const adminUser = await ensurePublicUser(authId);
  console.log(`✅`);
  console.log(`   Name  : ${adminUser.name}`);
  console.log(`   Email : ${adminUser.email}`);
  console.log(`   Plan  : ${adminUser.plan}`);
  console.log(`   Role  : ${adminUser.role}`);

  // 3. Downgrade old account
  process.stdout.write(`\n3. Downgrading ${OLD_EMAIL} to 'user'… `);
  const old = await downgradeOldUser();
  if (old) {
    console.log(`✅  (role is now: ${old.role})`);
  } else {
    console.log(`⚠️  Not found — skipping.`);
  }

  console.log(`\n✅  Done! Log in at /auth/login with:`);
  console.log(`   Email    : ${ADMIN_EMAIL}`);
  console.log(`   Password : ${ADMIN_PASSWORD}`);
  console.log(`   Then visit /admin\n`);
}

main().catch(err => {
  console.error("\n❌", err.message ?? err);
  process.exit(1);
});
