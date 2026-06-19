-- 009_subscriptions.sql
-- Adds Lemon Squeezy subscription tracking columns to users.
-- Run in Supabase SQL Editor or via: supabase db push

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS lemon_squeezy_customer_id      TEXT,
  ADD COLUMN IF NOT EXISTS lemon_squeezy_subscription_id  TEXT;

-- Fast lookup by customer / subscription ID in webhook handler
CREATE INDEX IF NOT EXISTS idx_users_ls_customer
  ON public.users(lemon_squeezy_customer_id)
  WHERE lemon_squeezy_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_ls_subscription
  ON public.users(lemon_squeezy_subscription_id)
  WHERE lemon_squeezy_subscription_id IS NOT NULL;
