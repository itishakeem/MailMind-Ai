-- Contact form submissions from the public /contact page.
-- Inserted via service role (no auth required — public submission).
create table if not exists contacts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 100),
  email       text not null,
  subject     text not null,
  message     text not null check (char_length(message) between 10 and 2000),
  created_at  timestamptz not null default now()
);

-- No RLS needed — only service role writes, no user reads.
-- Read-only access granted to authenticated admins via Supabase dashboard.
