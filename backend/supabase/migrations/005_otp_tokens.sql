-- OTP tokens for email verification (signup) and password reset
CREATE TABLE IF NOT EXISTS public.otp_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL,
  otp          TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('signup', 'password_reset')),
  reset_token  TEXT,
  expires_at   TIMESTAMPTZ NOT NULL,
  verified     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_tokens_email_type ON public.otp_tokens(email, type);
CREATE INDEX IF NOT EXISTS idx_otp_tokens_reset_token ON public.otp_tokens(reset_token) WHERE reset_token IS NOT NULL;

-- Only service-role can access this table (no RLS policies needed — service role bypasses RLS)
ALTER TABLE public.otp_tokens ENABLE ROW LEVEL SECURITY;
