-- Migration 010: Pro Features Pack
-- Creates email_templates and client_notes tables

-- ── email_templates ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_templates (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  subject    TEXT NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 200),
  body       TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 10000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_user
  ON public.email_templates(user_id, created_at DESC);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_templates_owner" ON public.email_templates
  FOR ALL USING (user_id = auth.uid());

-- ── client_notes ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_notes_client
  ON public.client_notes(client_id, created_at DESC);

ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_notes_owner" ON public.client_notes
  FOR ALL USING (user_id = auth.uid());
