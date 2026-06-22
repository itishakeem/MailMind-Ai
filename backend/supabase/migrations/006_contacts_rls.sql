-- Migration: 006_contacts_rls.sql
-- Creates the contacts table (if not already created by 004_contacts.sql)
-- and enables Row-Level Security on it.
-- Safe to run whether or not 004_contacts.sql was applied previously.

CREATE TABLE IF NOT EXISTS public.contacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  email       TEXT NOT NULL,
  subject     TEXT NOT NULL,
  message     TEXT NOT NULL CHECK (char_length(message) BETWEEN 10 AND 2000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS — no permissive policies means implicit DENY for anon/authenticated roles.
-- The service role (used by /api/contact) bypasses RLS by default in Supabase.
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
