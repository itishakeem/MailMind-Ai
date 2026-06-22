-- Migration: 007_otp_attempts.sql
-- Adds brute-force protection to OTP verification.
-- 'attempts' tracks failed guesses; tokens are locked after 5 wrong tries.

ALTER TABLE public.otp_tokens
  ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.otp_tokens.attempts IS
  'Failed verification attempts. Tokens are invalidated after 5 wrong guesses.';
