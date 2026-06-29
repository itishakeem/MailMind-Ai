-- Replace boolean is_admin with a role TEXT column.
-- New roles can be granted by updating the row — no schema change required.
-- The role hierarchy lives entirely in application code (types/index.ts).
ALTER TABLE public.users DROP COLUMN IF EXISTS is_admin;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- Partial index: fast lookup of non-user accounts (the minority)
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role) WHERE role <> 'user';
