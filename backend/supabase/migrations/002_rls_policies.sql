-- MailMind AI — Row Level Security Policies
-- Migration: 002_rls_policies.sql
-- Enforces per-user data isolation at the database layer (Constitution Principle I)

-- ─── users ───────────────────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can only read and update their own profile row
CREATE POLICY "users: select own row"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users: update own row"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Insert is handled exclusively by the auth trigger (003_auth_trigger.sql)
-- No direct INSERT policy for users table from client

-- ─── clients ─────────────────────────────────────────────────────────────────
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients: select own rows"
  ON public.clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "clients: insert own rows"
  ON public.clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clients: update own rows"
  ON public.clients FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clients: delete own rows"
  ON public.clients FOR DELETE
  USING (auth.uid() = user_id);

-- ─── emails ──────────────────────────────────────────────────────────────────
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "emails: select own rows"
  ON public.emails FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "emails: insert own rows"
  ON public.emails FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "emails: update own rows"
  ON public.emails FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "emails: delete own rows"
  ON public.emails FOR DELETE
  USING (auth.uid() = user_id);

-- ─── documents ───────────────────────────────────────────────────────────────
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents: select own rows"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "documents: insert own rows"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "documents: delete own rows"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Service role bypass (for cron job and server-side admin operations) ─────
-- The service role key bypasses RLS by default in Supabase.
-- Used exclusively by: /api/cron/send-scheduled (server-side, authenticated by CRON_SECRET)
-- Never exposed to the client browser.
