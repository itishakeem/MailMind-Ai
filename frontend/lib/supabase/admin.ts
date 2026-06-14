import { createClient } from "@supabase/supabase-js";

// Service-role Supabase client — bypasses RLS.
// Use ONLY in server-side trusted contexts (cron jobs, admin operations).
// NEVER expose the service role key to the browser.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
