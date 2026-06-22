# Implementation Plan: Security Hardening & Production Readiness

**Branch**: `004-security-hardening` | **Spec**: [spec.md](./spec.md)
**Phase 1**: 2026-06-16 — Initial audit (13 tasks, completed)
**Phase 2**: 2026-06-18 — Deep audit (18 additional findings, implemented)

---

## Phase 1 Summary (Completed)

Seven targeted fixes across four surface areas:
1. Injection / input validation (SR-001 to SR-002, SR-007 to SR-008)
2. Rate limiting on unauthenticated endpoints (SR-003 to SR-004)
3. HTTP security headers (SR-005)
4. Database RLS (SR-006)
5. AI fallback model migration (SR-009 to SR-011)

---

## Phase 2: Technical Approach

### Fix P2-1 — OTP Security (SR-012 to SR-015)

**Files**: `app/api/auth/send-otp/route.ts`, `app/api/auth/verify-otp/route.ts`,
`backend/supabase/migrations/007_otp_attempts.sql`

- Replace `Math.floor(100000 + Math.random() * 900000)` with `crypto.randomInt(100_000, 1_000_000)`.
- Add migration `007_otp_attempts.sql`: `ALTER TABLE otp_tokens ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0`.
- In `send-otp`: gate each call with `rateLimit("send-otp:<email>", 5, 10*60*1000)` → 429 if exceeded.
- In `verify-otp`:
  1. Check `token.attempts >= 5` → return 429 and delete token.
  2. Check expiry.
  3. Compare with `crypto.timingSafeEqual` (pads both buffers to equal length).
  4. On mismatch: `UPDATE otp_tokens SET attempts = attempts + 1 WHERE id = token.id`.
  5. Return remaining-attempts count in the error message for UX.

**Trade-off**: `timingSafeEqual` requires equal-length buffers — both sides padded to 32 bytes.
This introduces a tiny amount of extra work but prevents timing-based oracle attacks.

---

### Fix P2-2 — Plan Limit Atomicity (SR-016)

**File**: `lib/plan-limits.ts`

The previous implementation counted only `status = 'sent'` this month.
A user could schedule N emails simultaneously (all passing the check since none
are 'sent' yet), then the cron would send all N — bypassing the monthly cap.

**New approach**: Count `(sent this month) + (scheduled or sending anytime)`.

```ts
const [sentResult, scheduledResult] = await Promise.all([
  supabase...eq("status","sent").gte("sent_at",start).lte("sent_at",end),
  supabase...in("status",["scheduled","sending"]),
]);
const current = (sentResult.count ?? 0) + (scheduledResult.count ?? 0);
```

This means scheduled emails consume quota immediately, preventing batch abuse.

**Edge case**: Emails scheduled for future months also consume the current monthly quota.
This is intentional and preferred over the abuse vector. Users near their limit are prompted to upgrade.

---

### Fix P2-3 — Cron Idempotency (SR-017 to SR-018)

**Files**: `app/api/cron/send-scheduled/route.ts`, `backend/supabase/migrations/008_email_sending_status.sql`, `types/index.ts`

State machine before: `scheduled → sent | failed`
State machine after: `scheduled → sending → sent | failed`

The cron now performs one atomic batch UPDATE first:
```sql
UPDATE emails SET status = 'sending'
WHERE status = 'scheduled' AND scheduled_at <= NOW()
LIMIT 50
RETURNING *
```
Since Supabase REST UPDATE is row-level atomic, only the first cron instance to run
the UPDATE will see matching rows. A second concurrent instance will find no rows
(status already 'sending') and process nothing — preventing duplicate sends.

Migration 008 drops and recreates the status CHECK constraint to include 'sending'.

---

### Fix P2-4 — Contact Notification (SR-019)

**File**: `app/api/contact/route.ts`

The previous code called `sendGmail("system", ...)`, which looks up `gmail_token`
for userId `"system"` — a row that never exists. The call silently failed every time.

**Fix**: Replace with `transporter.sendMail(...)` from `lib/email/mailer.ts`.
Gate the notification behind: `notifyEmail && MAILER_USER && MAILER_APP_PASSWORD`.
If unconfigured, skip silently — contact form submission still succeeds.

---

### Fix P2-5 — Unbounded Query Caps (SR-020 to SR-021)

**Files**: `app/api/dashboard/stats/route.ts`, `app/api/clients/[id]/route.ts`

- Dashboard stats emails aggregation: add `.limit(500)`. Covers users up to 500 sent
  emails per month with full accuracy; beyond that the top-10 per-client table may
  reflect the most recent 500 rather than all time.
- Client detail emails: add `.limit(100)`. Shows 100 most recent email interactions.

---

### Fix P2-6 — File Upload Magic Bytes (SR-022)

**File**: `app/api/documents/upload/route.ts`

Read the full buffer, then check `buffer.slice(0, 4).toString("ascii") === "%PDF"`.
The old check used `file.type` (browser-controlled) and filename extension — both
trivially spoofable. Reject non-PDF binaries before passing to `pdf-parse`.

---

### Fix P2-7 — OAuth Redirect Safety (SR-023 to SR-024)

**Files**: `app/api/auth/callback/route.ts`, `app/api/gmail/connect/route.ts`

- Callback `next` guard: `rawNext.startsWith("/") && !rawNext.startsWith("//")`.
  Falls back to `/dashboard` if the value is absolute or a double-slash URL.
- PKCE cookies: add `sameSite: "lax"` to `cookieOpts` to make the attribute explicit.

---

### Fix P2-8 — Credential Hygiene (SR-025 to SR-026)

**Files**: `scripts/delete-all-users.mjs`, `.env.example`

- Remove hardcoded `SUPABASE_URL` and `SERVICE_ROLE_KEY` from the dev script.
  Exit with clear error if env vars are missing.
- Add `MAILER_USER`, `MAILER_APP_PASSWORD`, and `APP_NOTIFY_EMAIL` to `.env.example`
  with generation instructions.

---

## File Change Index (Phase 2)

| File | SR |
|---|---|
| `backend/supabase/migrations/007_otp_attempts.sql` | SR-027 |
| `backend/supabase/migrations/008_email_sending_status.sql` | SR-018, SR-028 |
| `frontend/types/index.ts` | SR-029 |
| `frontend/app/api/auth/send-otp/route.ts` | SR-012, SR-013 |
| `frontend/app/api/auth/verify-otp/route.ts` | SR-014, SR-015 |
| `frontend/lib/plan-limits.ts` | SR-016 |
| `frontend/app/api/cron/send-scheduled/route.ts` | SR-017 |
| `frontend/app/api/contact/route.ts` | SR-019 |
| `frontend/app/api/dashboard/stats/route.ts` | SR-020 |
| `frontend/app/api/clients/[id]/route.ts` | SR-021 |
| `frontend/app/api/documents/upload/route.ts` | SR-022 |
| `frontend/app/api/auth/callback/route.ts` | SR-023 |
| `frontend/app/api/gmail/connect/route.ts` | SR-024 |
| `frontend/scripts/delete-all-users.mjs` | SR-025 |
| `frontend/.env.example` | SR-026 |

## Risk Assessment (Phase 2)

| Risk | Likelihood | Mitigation |
|---|---|---|
| Plan limit too strict (scheduled emails consume quota) | Medium | Prompt users near limit; this is intentional |
| `sending` status leaks into UI if cron crashes mid-send | Low | Cron marks `failed` on any exception; a stuck `sending` row can be manually reset |
| `timingSafeEqual` buffer padding changes comparison semantics | Very low | Both sides padded to same constant length; OTP mismatch is still detected |
| `limit(500)` on stats causes inaccurate per-client counts for power users | Low | Top-10 table is approximate for heavy users; acceptable for a dashboard widget |
