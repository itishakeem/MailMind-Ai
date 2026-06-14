# Data Model: MailMind AI — Full Product

**Branch**: `001-mailmind-ai` | **Date**: 2026-06-12
**Phase**: Phase 1 — Design

---

## Entity Relationship Overview

```
auth.users (Supabase managed)
    │
    └── users (1:1 extension)
          │
          ├── clients (1:N)
          │     │
          │     └── emails (M:1 client, M:1 user)
          │
          ├── emails (1:N, user-owned regardless of client)
          │
          └── documents (1:N)
```

---

## Table: users

Extends Supabase's `auth.users` with application-specific profile and Gmail credentials.

```sql
CREATE TABLE public.users (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  email            TEXT NOT NULL UNIQUE,
  plan             TEXT NOT NULL DEFAULT 'free'
                     CHECK (plan IN ('free', 'pro', 'business')),
  gmail_email      TEXT,              -- connected Gmail address (display only)
  gmail_token      TEXT,              -- AES-256-GCM encrypted: "iv:ciphertext"
                                      -- contains JSON {access_token, refresh_token}
  email_signature  TEXT,              -- optional custom signature (plain text)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users: own row only"
  ON public.users FOR ALL
  USING  (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

**Validation rules**:
- `plan` MUST be one of `free`, `pro`, `business`; default `free` on registration
- `gmail_token` MUST be null when Gmail is disconnected
- `email_signature` maximum 500 characters

**State transitions for Gmail connection**:
```
disconnected → connected   (gmail_token set after OAuth callback)
connected    → disconnected (gmail_token set to null on disconnect)
connected    → error        (refresh fails; user notified; token left for retry)
```

---

## Table: clients

Contact records managed per user.

```sql
CREATE TABLE public.clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  company     TEXT,
  address     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_user_id ON public.clients(user_id);

-- RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients: own rows only"
  ON public.clients FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Validation rules**:
- `name` required, 1–200 characters
- `email` required, valid email format (enforced in API layer)
- `phone`, `company`, `address` optional, max 200 characters each
- Free plan: maximum 3 rows per `user_id` (enforced in API layer, not database)

---

## Table: emails

Audit trail for all email activity. Retained even when the associated client is deleted.

```sql
CREATE TABLE public.emails (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  client_id        UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_snapshot  JSONB,             -- {name, email} captured at send time
                                      -- preserved after client deletion
  subject          TEXT NOT NULL,
  body             TEXT NOT NULL,
  ai_detected_type TEXT CHECK (ai_detected_type IN (
                     'invoice', 'payment_reminder', 'project_update',
                     'proposal', 'manual'
                   )),
  tone             TEXT CHECK (tone IN ('friendly', 'formal', 'strict')),
  status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')),
  scheduled_at     TIMESTAMPTZ,       -- NULL for immediate sends
  sent_at          TIMESTAMPTZ,       -- set when Gmail API confirms delivery
  failure_reason   TEXT,              -- set on status = 'failed'
  gmail_message_id TEXT,              -- Gmail API returned message ID (for reference)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emails_user_id         ON public.emails(user_id);
CREATE INDEX idx_emails_status          ON public.emails(status);
CREATE INDEX idx_emails_scheduled_at    ON public.emails(scheduled_at)
  WHERE status = 'scheduled';
CREATE INDEX idx_emails_user_month      ON public.emails(user_id, sent_at)
  WHERE status = 'sent';

-- RLS
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emails: own rows only"
  ON public.emails FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**State machine**:
```
draft → scheduled  (user selects Schedule + future datetime)
draft → sent       (user clicks Send Now; Gmail API confirms)
scheduled → sent   (cron job delivers at scheduled_at)
scheduled → failed (Gmail API error during cron delivery)
failed → sent      (user retries; Gmail API succeeds)
failed → cancelled (user cancels failed email)
scheduled → cancelled (user cancels before delivery)
```

**Validation rules**:
- `scheduled_at` MUST be in the future when status is set to `scheduled`
- `client_snapshot` MUST be populated on insert (captures client name+email at send time)
- `sent_at` set only when status transitions to `sent`
- `failure_reason` set only when status transitions to `failed`
- Free plan: `sent_at IS NOT NULL` count for current calendar month MUST NOT exceed 10

---

## Table: documents

Stores extracted text from PDF uploads. Binary PDF is never persisted.

```sql
CREATE TABLE public.documents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  filename       TEXT NOT NULL,
  extracted_text TEXT NOT NULL,
  uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_user_id ON public.documents(user_id);

-- RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents: own rows only"
  ON public.documents FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Validation rules**:
- `filename` max 255 characters; stored for display only
- `extracted_text` required and non-empty (reject upload if extraction yields empty string)
- Documents older than 30 days MAY be purged (retention policy; not blocking for Phase 1)

---

## TypeScript Types (types/index.ts)

```typescript
export type Plan = 'free' | 'pro' | 'business';
export type EmailStatus = 'draft' | 'scheduled' | 'sent' | 'failed';
export type EmailType = 'invoice' | 'payment_reminder' | 'project_update' | 'proposal' | 'manual';
export type Tone = 'friendly' | 'formal' | 'strict';

export interface User {
  id: string;
  name: string;
  email: string;
  plan: Plan;
  gmail_email: string | null;
  gmail_connected: boolean; // derived: gmail_token IS NOT NULL
  email_signature: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Email {
  id: string;
  user_id: string;
  client_id: string | null;
  client_snapshot: { name: string; email: string };
  subject: string;
  body: string;
  ai_detected_type: EmailType | null;
  tone: Tone | null;
  status: EmailStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  failure_reason: string | null;
  created_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  filename: string;
  extracted_text: string;
  uploaded_at: string;
}

export interface PlanLimits {
  max_emails_per_month: number | null;  // null = unlimited
  max_clients: number | null;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free:     { max_emails_per_month: 10, max_clients: 3 },
  pro:      { max_emails_per_month: null, max_clients: null },
  business: { max_emails_per_month: null, max_clients: null },
};
```
