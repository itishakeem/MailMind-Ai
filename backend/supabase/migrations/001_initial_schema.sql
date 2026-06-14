-- MailMind AI — Initial Schema
-- Migration: 001_initial_schema.sql
-- Run in Supabase SQL Editor or via Supabase CLI: supabase db push

-- ─── users ───────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users with app-specific profile and encrypted Gmail tokens.
CREATE TABLE IF NOT EXISTS public.users (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  email            TEXT NOT NULL UNIQUE,
  plan             TEXT NOT NULL DEFAULT 'free'
                     CHECK (plan IN ('free', 'pro', 'business')),
  gmail_email      TEXT,
  -- AES-256-GCM encrypted JSON {access_token, refresh_token}
  -- Stored as "hex_iv:hex_ciphertext". NULL when Gmail is disconnected.
  gmail_token      TEXT,
  email_signature  TEXT CHECK (char_length(email_signature) <= 500),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── clients ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  email       TEXT NOT NULL CHECK (char_length(email) <= 320),
  phone       TEXT CHECK (char_length(phone) <= 200),
  company     TEXT CHECK (char_length(company) <= 200),
  address     TEXT CHECK (char_length(address) <= 200),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);

-- ─── emails ──────────────────────────────────────────────────────────────────
-- Full audit trail. Retained even when the client is deleted (client_id → NULL).
CREATE TABLE IF NOT EXISTS public.emails (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  client_id        UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  -- Snapshot of client name+email captured at send/schedule time
  client_snapshot  JSONB NOT NULL DEFAULT '{}',
  subject          TEXT NOT NULL,
  body             TEXT NOT NULL,
  ai_detected_type TEXT CHECK (ai_detected_type IN (
                     'invoice', 'payment_reminder', 'project_update',
                     'proposal', 'manual'
                   )),
  tone             TEXT CHECK (tone IN ('friendly', 'formal', 'strict')),
  status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')),
  scheduled_at     TIMESTAMPTZ,
  sent_at          TIMESTAMPTZ,
  failure_reason   TEXT,
  gmail_message_id TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emails_user_id      ON public.emails(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_status       ON public.emails(status);
CREATE INDEX IF NOT EXISTS idx_emails_scheduled    ON public.emails(scheduled_at)
  WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_emails_user_month   ON public.emails(user_id, sent_at)
  WHERE status = 'sent';

-- ─── documents ───────────────────────────────────────────────────────────────
-- Stores extracted PDF text only. No binary blobs. (Constitution Principle VI)
CREATE TABLE IF NOT EXISTS public.documents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  filename       TEXT NOT NULL CHECK (char_length(filename) <= 255),
  extracted_text TEXT NOT NULL CHECK (char_length(extracted_text) > 0),
  uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);

-- ─── updated_at auto-update function ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER emails_updated_at
  BEFORE UPDATE ON public.emails
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
