-- Migration: 008_email_sending_status.sql
-- Adds 'sending' as an intermediate status so the cron job can atomically claim
-- a row before attempting delivery, preventing duplicate sends across concurrent
-- cron instances.

DO $$
DECLARE
  cname TEXT;
BEGIN
  -- Find the existing CHECK constraint on emails.status (name varies by Postgres version)
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'public.emails'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%status%IN%';

  IF cname IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.emails DROP CONSTRAINT ' || quote_ident(cname);
  END IF;
END $$;

ALTER TABLE public.emails
  ADD CONSTRAINT emails_status_check
  CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed'));

COMMENT ON COLUMN public.emails.status IS
  'draft | scheduled | sending (claimed by cron) | sent | failed';
