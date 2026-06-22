# Data Model: MailMind Conversational Agent (006)

**Date**: 2026-06-22  
**Branch**: `006-conversational-agent`

---

## Existing Entities (reused, not modified)

### Client
**Table**: `public.clients`  
**Source**: `backend/supabase/migrations/001_initial_schema.sql`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `user_id` | UUID | NOT NULL, FK → users(id) ON DELETE CASCADE | RLS enforces user isolation |
| `name` | TEXT | NOT NULL, 1–200 chars | |
| `email` | TEXT | NOT NULL, ≤ 320 chars | |
| `phone` | TEXT | optional, ≤ 200 chars | Not used by agent v1 |
| `company` | TEXT | optional, ≤ 200 chars | Used for industry/category input |
| `address` | TEXT | optional, ≤ 200 chars | Not used by agent v1 |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

**RLS**: All 4 CRUD operations use `auth.uid() = user_id`. Agent uses anon-key server client — RLS applies automatically.

**Agent write fields** (add_client tool): `user_id`, `name`, `email`, `company` (optional).  
**Agent delete target** (remove_client tool): Delete by `id` scoped to `user_id`.

---

### User (plan field)
**Table**: `public.users`  
**Source**: `backend/supabase/migrations/001_initial_schema.sql`

| Column | Type | Values | Notes |
|---|---|---|---|
| `id` | UUID | PK | |
| `plan` | TEXT | 'free', 'pro', 'business' | Agent access: pro + business only |
| `gmail_email` | TEXT | optional | Used to detect Gmail connection |
| `gmail_token` | TEXT | optional | NULL = disconnected |

**Plan check query** (reuses existing pattern from `lib/plan-limits.ts`):
```typescript
const { data: user } = await supabase.from('users').select('plan, gmail_token').eq('id', userId).single();
if (user.plan === 'free') return 403;
```

---

### Email (audit trail for sent emails)
**Table**: `public.emails`  
**Source**: existing migrations (reused for send_email audit)

The agent's `send_email` handler persists a record here after calling `sendGmail()`, exactly as the existing `/api/emails/send` route does. No schema changes needed.

---

## New Runtime Structures (no DB persistence)

### ConversationMessage
Passed client-side, included in each `/api/agent/chat` request. Not stored in the database.

```typescript
interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}
```

**Constraints**:
- Maximum 10 messages sent per request (last 10 turns of history)
- Session-scoped: cleared when user navigates away or closes the panel

---

### PendingAction
Returned by the server when a destructive/external action requires confirmation. Stored in React state client-side. Sent back with the next request when the user confirms.

```typescript
type PendingActionType = 'remove_client' | 'send_email';

interface PendingRemoveClient {
  type: 'remove_client';
  client: { id: string; name: string; email: string; company: string | null };
}

interface PendingSendEmail {
  type: 'send_email';
  client: { id: string; name: string; email: string };
  draft: { subject: string; body: string };
}

type PendingAction = PendingRemoveClient | PendingSendEmail;
```

---

### AgentResponse
The response envelope returned by `POST /api/agent/chat`.

```typescript
type AgentResponseType = 'text' | 'confirmation' | 'action_result' | 'clarification';

interface AgentTextResponse {
  type: 'text';
  content: string;
}

interface AgentConfirmationResponse {
  type: 'confirmation';
  content: string;          // Human-readable description of pending action
  pendingAction: PendingAction;
}

interface AgentActionResultResponse {
  type: 'action_result';
  content: string;          // e.g. "Ahmed Khan has been removed."
  success: boolean;
}

interface AgentClarificationResponse {
  type: 'clarification';
  content: string;          // e.g. "Found 2 clients named Sarah: ..."
  options: Array<{ id: string; name: string; email: string }>;
}

type AgentResponse =
  | AgentTextResponse
  | AgentConfirmationResponse
  | AgentActionResultResponse
  | AgentClarificationResponse;
```

---

## Entity Relationships (for agent)

```
users (1) ──── (*) clients
  │
  └── plan: 'free' | 'pro' | 'business'
  └── gmail_token: NULL = disconnected

clients (1) ──── (*) emails
  │
  └── agent writes: add_client → INSERT
  └── agent reads: fuzzy match for remove/send
  └── agent deletes: remove_client → DELETE (after confirmation)

[Runtime only — no DB]
ConversationMessage[]  →  sent per request, session-scoped
PendingAction          →  React state, cleared after confirm/cancel
```

---

## Validation Rules (agent tool inputs)

### add_client
| Field | Rule |
|---|---|
| `name` | Required, non-empty string, ≤ 200 chars |
| `email` | Required, valid email format (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) |
| `company` | Optional, ≤ 200 chars if provided |

### remove_client
| Field | Rule |
|---|---|
| `identifier` | Required string (name or email substring for fuzzy match) |
| `confirmed_id` | UUID of the specific client — required on confirmed execution |

### send_email
| Field | Rule |
|---|---|
| `client_identifier` | Required string (name or email substring) |
| `instructions` | Required, non-empty string |
| `confirmed_client_id` | UUID — required on confirmed execution |
| `confirmed_draft` | `{ subject, body }` — required on confirmed execution |
