# Data Model: Pro Features Pack

**Feature**: `005-pro-features` | **Phase**: 1 | **Date**: 2026-06-19

---

## New Tables

### `email_templates`

Stores reusable email templates owned by Pro users.

```sql
CREATE TABLE public.email_templates (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  subject    TEXT NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 200),
  body       TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 10000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_templates_user ON public.email_templates(user_id, created_at DESC);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner access" ON public.email_templates
  FOR ALL USING (user_id = auth.uid());
```

**Validation rules**:
- `name`: 1–100 characters; duplicates allowed (no unique constraint).
- `subject`: 1–200 characters.
- `body`: 1–10,000 characters.
- Max 50 templates per user — enforced at API layer (COUNT query before INSERT).

---

### `client_notes`

Stores private, timestamped notes attached to a client record.

```sql
CREATE TABLE public.client_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_notes_client ON public.client_notes(client_id, created_at DESC);

ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner access" ON public.client_notes
  FOR ALL USING (user_id = auth.uid());
```

**Validation rules**:
- `body`: 1–2,000 characters.
- Notes are displayed in reverse-chronological order (ORDER BY created_at DESC).
- `user_id` is stored alongside `client_id` to avoid a join in RLS policies.

---

## Existing Column (no migration needed)

### `users.email_signature`

Already added in migration 001. Column: `TEXT NULL` (no length constraint in DB; enforce ≤500 chars at API layer).

Pro users: field is editable and appended to sent emails.
Free users: field shows as read-only with upgrade prompt; saving is blocked at API layer.

---

## TypeScript Type Changes

### `types/index.ts`

```typescript
// Before
export type Tone = "friendly" | "formal" | "strict";

// After
export type Tone = "friendly" | "formal" | "strict" | "urgent" | "apologetic" | "persuasive";
```

New interfaces:

```typescript
export interface EmailTemplate {
  id: string;
  user_id: string;
  name: string;
  subject: string;
  body: string;
  created_at: string;
}

export interface ClientNote {
  id: string;
  client_id: string;
  user_id: string;
  body: string;
  created_at: string;
}
```

---

## Migration File

**Path**: `backend/supabase/migrations/010_pro_features.sql`

Contains:
1. `CREATE TABLE email_templates` with index + RLS
2. `CREATE TABLE client_notes` with index + RLS

No column additions to existing tables required (signature column already present).
