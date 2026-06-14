-- MailMind AI — Auth Trigger
-- Migration: 003_auth_trigger.sql
-- Automatically creates a public.users row when a new auth.users record is inserted.
-- Handles both email/password signup and Google OAuth sign-in.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, plan)
  VALUES (
    NEW.id,
    -- Prefer full_name from Google OAuth metadata; fall back to email prefix
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    'free'
  )
  ON CONFLICT (id) DO NOTHING; -- Idempotent: safe to call multiple times
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger fires after every new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
