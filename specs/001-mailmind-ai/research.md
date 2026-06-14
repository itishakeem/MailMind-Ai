# Research: MailMind AI — Full Product

**Branch**: `001-mailmind-ai` | **Date**: 2026-06-12
**Phase**: Phase 0 — Research & Decision Log

---

## 1. Gmail OAuth 2.0 Send-Only Scope

**Decision**: Use scope `https://www.googleapis.com/auth/gmail.send` exclusively.

**Rationale**: This is the minimum OAuth scope that allows sending emails via the Gmail
API. It does not grant read, modify, or delete permissions. Google's OAuth consent screen
will show "Send email on your behalf" — the most trustworthy possible disclosure for users.

**Alternatives considered**:
- `https://mail.google.com/` (full access) — rejected; violates Constitution Principle I
  (Security & Privacy First — minimum required scope).
- `https://www.googleapis.com/auth/gmail.modify` — rejected; read access unnecessary
  and increases scope of potential token misuse.

**Implementation note**: Flow must use PKCE (Proof Key for Code Exchange) since the
callback runs in a Next.js Route Handler (server-side). Tokens encrypted with AES-256
before storing in Supabase. Refresh handled server-side; refresh token stored encrypted
alongside access token.

---

## 2. Supabase Row Level Security (RLS) for Multi-Tenant Isolation

**Decision**: Enable RLS on all tables (`users`, `clients`, `emails`, `documents`).
All SELECT/INSERT/UPDATE/DELETE policies use `auth.uid() = user_id` predicate.

**Rationale**: Supabase RLS is PostgreSQL-native and enforced at the database layer,
meaning even a misconfigured API route cannot leak cross-user data. This satisfies
Constitution Principle I (data isolation) without requiring application-layer guards
on every query.

**Alternatives considered**:
- Application-layer filtering only — rejected; a single missed WHERE clause exposes all
  users' data. Defence-in-depth requires database enforcement.
- Separate schema per user — rejected; operationally complex and incompatible with
  Supabase free tier connection limits.

**Policy pattern**:
```sql
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can only access their own clients"
  ON clients FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## 3. OpenRouter Integration for Gemini Flash (Primary AI)

**Decision**: Use OpenRouter's API with model ID `google/gemini-flash-1.5` via HTTP
POST to `https://openrouter.ai/api/v1/chat/completions`.

**Rationale**: OpenRouter provides a unified API across multiple AI providers, enabling
seamless fallback without SDK changes. Gemini Flash is the most cost-effective capable
model at ~$0.075/1M input tokens. $5 credit ≈ 50,000 email generations.

**Alternatives considered**:
- Gemini API directly (Google AI Studio) — rejected; OpenRouter normalises the
  request/response format, making the fallback to Nemotron trivial to implement.
- GPT-4o-mini — rejected; higher per-token cost for equivalent quality on email tasks.

**Rate limit strategy**: OpenRouter allows burst; no per-minute limit issues at beta
scale. At 1,000 users × 30 emails = 900 requests/day — well within limits.

---

## 4. NVIDIA NIM API for Nemotron 3 Super (Fallback AI)

**Decision**: Use NVIDIA NIM endpoint for `nvidia/nemotron-3-8b-chat-4k-steerlm`
(Nemotron 3 Super) as the free fallback.

**Rationale**: 200 free requests/day from NVIDIA NIM is sufficient for the 10-user beta.
The NIM API also uses OpenAI-compatible `/v1/chat/completions` format, meaning the
fallback requires only a URL and key swap — no structural code change.

**Alternatives considered**:
- Groq (Llama 3) — available but not mentioned in the project spec; sticking with
  spec-defined stack per Constitution Technology Constraints.
- No fallback — rejected; violates Constitution Principle IV (Graceful Degradation).

**Fallback trigger**: Any HTTP 5xx, 429, or timeout >15s from OpenRouter triggers one
retry, then falls back to Nemotron. If Nemotron also fails, manual compose mode
activates (FR-024).

---

## 5. Vercel Cron Jobs for Scheduled Email Delivery

**Decision**: Define a cron job in `vercel.json` that fires every minute, calling
`/api/cron/send-scheduled`.

**Rationale**: Vercel Cron Jobs (free tier: 1 job, max 1/day on Hobby; **Pro plan
required for per-minute cron**). At beta scale (10 users), polling every 5 minutes on
free tier is acceptable; the spec target of "within 5 minutes of scheduled time" is met.

**Delivery window**: Success Criteria SC-004 requires delivery within 5 min. A 1-minute
cron on Pro or a 5-minute cron on free both satisfy this.

```json
{
  "crons": [
    {
      "path": "/api/cron/send-scheduled",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Security**: Cron route protected by a `CRON_SECRET` env var checked against
`Authorization: Bearer <CRON_SECRET>` header injected by Vercel.

**Alternatives considered**:
- Supabase Edge Functions with pg_cron — adds complexity; Vercel Cron is simpler and
  aligns with the existing Vercel deployment.
- External cron service (e.g., EasyCron) — unnecessary third-party dependency.

---

## 6. pdf-parse for PDF Text Extraction

**Decision**: Use `pdf-parse` npm package in a Next.js Route Handler (`/api/documents/upload`).

**Rationale**: pdf-parse is the simplest zero-dependency PDF text extractor for Node.js.
It handles machine-generated PDFs (the primary use case: invoices, contracts). It runs
server-side in the Route Handler, so it never executes in the browser bundle.

**Limitations documented**:
- Scanned/image-only PDFs return empty text — out of scope per spec Assumptions
  (OCR not required for Phase 1).
- Password-protected PDFs return an error — edge case handled by returning error to
  the user with a prompt to enter description manually (FR-016 fallback).

**File size limit**: 10 MB maximum per upload, enforced in the Route Handler before
parsing.

---

## 7. Next.js 14 App Router + Supabase Auth

**Decision**: Use `@supabase/ssr` package for server-side auth with Next.js App Router.
Sessions stored in HTTP-only cookies, refreshed via middleware.

**Rationale**: `@supabase/ssr` is the official Supabase package for Next.js App Router.
It handles cookie-based sessions and token refresh transparently via a `middleware.ts`
file, satisfying FR-003 (automatic session refresh without prompting user to log in).

**Google OAuth for login**: Supabase Auth handles Google OAuth sign-in via its built-in
provider. This is separate from the Gmail API OAuth (which grants send permission) — two
distinct OAuth flows with different scopes and purposes.

**Two-OAuth distinction** (critical):
- **Supabase Google OAuth** (login): `openid email profile` scope — identifies user
- **Gmail API OAuth** (send): `gmail.send` scope — authorises sending

Both flows are user-initiated and explicitly consented. Tokens are stored separately.

---

## 8. Plan Limit Enforcement Strategy

**Decision**: Enforce plan limits in a centralised `lib/plan-limits.ts` module called
from every relevant Route Handler before any create/send operation.

**Rationale**: UI-only enforcement can be bypassed by direct API calls. The spec requires
server-layer enforcement (FR-009). Centralising the logic prevents divergence between
routes.

**Free plan limits**:
- Max 10 emails sent per calendar month (count `status IN ('sent')` for current month)
- Max 3 stored clients (count active client records)

**Limit check pattern**:
```typescript
await assertPlanLimit(userId, 'email_send'); // throws PlanLimitError if over limit
```
Route Handler catches `PlanLimitError` and returns HTTP 402 with upgrade prompt payload.

---

## 9. Token Encryption Strategy

**Decision**: Encrypt Gmail OAuth tokens using AES-256-GCM with a server-side
`ENCRYPTION_KEY` env var (32-byte random secret) before storing in Supabase.

**Rationale**: Supabase encrypts data at rest at the infrastructure level, but field-level
encryption provides defence-in-depth. If the database is compromised, tokens remain
unusable without the encryption key. This satisfies Constitution Principle I.

**Implementation**: Node.js built-in `crypto` module (`createCipheriv` / `createDecipheriv`);
no additional npm dependency needed. IV (initialisation vector) stored alongside the
ciphertext as `iv:ciphertext` in the same database column.

---

## 10. AI Prompt Strategy

**Decision**: Use a structured system prompt with dynamic injection of:
- Detected context type
- Selected tone
- Extracted content (PDF text or free-text description)

**Prompt template pattern**:
```
You are a professional email writer for a South Asian freelancer.
Context type: {invoice|payment_reminder|project_update|proposal}
Tone: {friendly|formal|strict}
User input: {extracted_text_or_description}

Generate:
- Subject: [one line, professional]
- Body: [3-5 short paragraphs, professional closing]

Respond in JSON: {"subject": "...", "body": "..."}
```

**JSON response format**: Forces structured output, making parsing deterministic.
Validated with a Zod schema before returning to the client.

**Type detection**: First pass classifies the input into one of 4 types with a short
prompt before generation. This result is shown to the user (FR-018) for correction before
generation (FR-019).
