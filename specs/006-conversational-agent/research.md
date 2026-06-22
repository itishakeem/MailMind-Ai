# Research: MailMind Conversational Agent (006)

**Date**: 2026-06-22  
**Branch**: `006-conversational-agent`  
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## 1. Clients Table — Actual Schema

**Decision**: Use `company` column for the optional category/industry field. Do NOT add a `category` column.

**Rationale**: The `clients` table has no `category` or `type` column. The closest existing analog is `company` (TEXT, optional, ≤ 200 chars), which serves the same purpose (describing the client's business context). The build spec's references to "real estate", "marketing" etc. map cleanly to the `company` field. Creating a new column is out of scope for v1.

**Exact schema confirmed** (`backend/supabase/migrations/001_initial_schema.sql`):
```
id          UUID PRIMARY KEY
user_id     UUID NOT NULL → public.users(id)
name        TEXT NOT NULL  (1–200 chars)
email       TEXT NOT NULL  (≤ 320 chars)
phone       TEXT           (≤ 200 chars, optional)
company     TEXT           (≤ 200 chars, optional)  ← use for industry/category
address     TEXT           (≤ 200 chars, optional)
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

**Alternatives considered**: Adding a new `category` column. Rejected because: out of scope for v1, and `company` already captures the same business-context information.

---

## 2. Plan Field — Actual Values

**Decision**: Gate agent access on `plan IN ('pro', 'business')`. The tier called 'agency' in the build spec does not exist in the database.

**Rationale**: The `users.plan` column is constrained to `CHECK (plan IN ('free', 'pro', 'business'))`. The build spec referenced 'agency' as a higher tier, but the actual schema uses 'business'. All server-side plan checks must use these exact string values.

**Source**: `backend/supabase/migrations/001_initial_schema.sql`, line ~13.  
**TypeScript type**: `export type Plan = "free" | "pro" | "business"` — `frontend/types/index.ts`.

---

## 3. ChatKit — Not Available; Custom UI Required

**Decision**: Build a custom chat panel using React + Tailwind CSS. Do NOT install `@openai/chatkit-react`.

**Rationale**: `@openai/chatkit-react` is not a publicly available npm package (it is not present in the project's `package.json`, and there is no stable public release of this library). The build spec itself flagged uncertainty about ChatKit SDK language support. Building a custom component:
- Stays within the existing stack (Next.js 14 + Tailwind + Lucide icons)
- Requires zero new npm dependencies for the UI layer
- Gives full control over the confirmation card UX without depending on an undocumented widget API
- Follows the existing pattern used by all other MailMind components

**Custom UI components needed**:
- `AgentChatPanel` — full chat container with message list + composer
- `AgentMessage` — individual message bubble (user / assistant)
- `ConfirmActionCard` — confirmation card for remove_client and send_email with Yes/Cancel buttons
- `EmailDraftCard` — shows subject + body of generated email draft before send

**Alternatives considered**:
- `@openai/chatkit-react` — Not available publicly; rejected.
- Vercel AI SDK (`ai` npm package) for streaming — Adds a dependency; streaming not required for v1 since Gemini responses are fast. Can be added in v2. Rejected for now.

---

## 4. Agent Backend Architecture — Tool Calling via Existing OpenRouter Client

**Decision**: The agent backend is a single Next.js API route (`/api/agent/chat`) that uses the same OpenAI SDK + OpenRouter pattern already in `lib/ai/generate.ts` to call Gemini with function/tool definitions.

**Rationale**: The existing `generate.ts` already initializes the OpenAI SDK with OpenRouter's base URL and calls Gemini 2.5 Flash. The same SDK supports tool/function calling natively (via `tools` parameter). No new AI client is needed — the agent route follows the exact same initialization pattern.

**Tool calling flow**:
1. Build message array + tool definitions
2. Call `openRouter().chat.completions.create({ model: "google/gemini-2.5-flash", tools: [...], messages: [...] })`
3. If response has `tool_calls` → extract tool name + args → execute handler
4. If response has `content` → return as plain text reply

**Conversation history**: Managed entirely client-side. The frontend sends the last N messages (capped at 10 turns) with each request. No server-side session state needed. This keeps the backend stateless and consistent with existing route patterns.

**Alternatives considered**:
- Separate agent microservice (Python) — Rejected: not needed when OpenAI SDK handles tool calling in Node/TypeScript.
- Vercel AI SDK `streamText` — Rejected: streaming adds complexity; not required for v1.
- Storing conversation history server-side in Supabase — Rejected: session-scoped only per spec; no persistence requirement in v1.

---

## 5. Reusable Functions Confirmed

| Function | File | Signature | Use in Agent |
|---|---|---|---|
| `generateEmail` | `lib/ai/generate.ts` | `(params: GenerateEmailParams) → { subject, body, model_used }` | Draft generation in send_email handler |
| `sendGmail` | `lib/gmail/send.ts` | `(userId, to, subject, body) → { messageId }` | Email sending after confirmation |
| `assertPlanLimit` | `lib/plan-limits.ts` | `(supabase, userId, type) → void (throws)` | Client add plan check |
| `createClient` (server) | `lib/supabase/server.ts` | `() → SupabaseServerClient` | Auth + DB in agent route |

**Email persistence**: After calling `sendGmail()`, the agent must also insert a record into the `emails` table (same as the existing `/api/emails/send` route does). This ensures the audit trail requirement (Constitution §VI) is met. A shared helper function will be extracted for this.

---

## 6. Row Level Security — Agent Route Strategy

**Decision**: Agent route uses the authenticated anon-key Supabase server client (NOT the admin/service-role client). All Supabase queries run under the user's session, so RLS automatically enforces per-user isolation.

**Rationale**: The admin client bypasses RLS — using it in the agent route would allow a bug to accidentally access another user's data. The server client with the user's session cookie is the correct and safe choice. RLS policies on `clients` already cover SELECT, INSERT, UPDATE, DELETE — the agent gets isolation for free.

---

## 7. CSP Impact

**Decision**: No changes to `next.config.mjs` CSP headers required.

**Rationale**: All agent calls go to MailMind's own `/api/agent/chat` endpoint (same origin) and to OpenRouter (already whitelisted under `connect-src`). The custom chat UI has no external CDN or socket dependencies.

---

## 8. Fuzzy Client Matching Strategy

**Decision**: Case-insensitive substring match on `name` and `email` fields. If 0 matches → inform user. If 1 match → proceed (with confirmation for destructive actions). If 2+ matches → ask user to clarify before proceeding.

**Rationale**: This is the simplest correct implementation. The `clients` table is user-scoped (≤ a few hundred records), so an in-memory filter after fetching all user clients is fast enough. A Postgres `ILIKE` query would also work but adds query complexity without measurable benefit at this scale.

```typescript
function fuzzyMatchClients(clients: Client[], identifier: string): Client[] {
  const q = identifier.toLowerCase();
  return clients.filter(
    c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
  );
}
```
