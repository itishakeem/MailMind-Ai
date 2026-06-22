---
description: "Implementation tasks for Security Hardening & Production Readiness"
---

# Tasks: Security Hardening & Production Readiness

**Input**: Design documents from `/specs/004-security-hardening/`
**Prerequisites**: plan.md ✅ | spec.md ✅
**Branch**: `004-security-hardening`
**Stack**: TypeScript 5, Next.js 14, Supabase, OpenRouter

---

## Phase 1 — Initial Audit (All Completed)

- [x] T401 Fix email header injection in `lib/gmail/send.ts` `buildRawMessage()`.
- [x] T402 Add `assertPlanLimit` to retry route before `sendGmail`.
- [x] T403 Add subject/body max length in `app/api/emails/send/route.ts`.
- [x] T404 Same length caps in `app/api/emails/schedule/route.ts`.
- [x] T405 Create `lib/rate-limit.ts` sliding-window in-memory limiter.
- [x] T406 Apply DB-backed rate limit to `app/api/contact/route.ts` (5/hour/email).
- [x] T407 Apply in-process rate limit to `app/api/auth/password-reset/route.ts` (5/15min, silent skip).
- [x] T408 Add max text length guard in `app/api/ai/detect-type/route.ts`.
- [x] T409 Same length guard in `app/api/ai/generate/route.ts`.
- [x] T410 Update `frontend/next.config.mjs` with all 6 security headers.
- [x] T411 Create `backend/supabase/migrations/006_contacts_rls.sql`.
- [x] T412 Update `lib/ai/generate.ts` — remove nvidiaClient, use OpenRouter fallback, classify errors.
- [x] T413 Update `frontend/.env.example` — remove NVIDIA_API_KEY, document OpenRouter fallback.

---

## Phase 2 — Deep Audit (All Completed)

### Group A: OTP Security (SR-012 to SR-015, SR-027)

- [x] T414 Create `backend/supabase/migrations/007_otp_attempts.sql`:
  `ALTER TABLE otp_tokens ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0`.
  **Verify**: Column appears in Supabase table editor; existing rows default to 0.

- [x] T415 Fix OTP generation in `app/api/auth/send-otp/route.ts`:
  Replace `Math.floor(100000 + Math.random() * 900000)` with `randomInt(100_000, 1_000_000)` from `node:crypto`.
  **Verify**: Generated OTP is a 6-digit string between 100000 and 999999 inclusive.

- [x] T416 Add OTP send rate limiting in `app/api/auth/send-otp/route.ts`:
  `rateLimit("send-otp:<email>", 5, 10*60*1000)` → 429 with `Retry-After: 600` if exceeded.
  **Verify**: 6th POST with same email within 10 min → 429.

- [x] T417 Add attempt limiting and timing-safe comparison in `app/api/auth/verify-otp/route.ts`:
  - Check `token.attempts >= 5` before expiry check → 429, delete token.
  - Replace `token.otp !== otp` with `crypto.timingSafeEqual` (pad both to 32 bytes).
  - On wrong OTP: `UPDATE otp_tokens SET attempts = attempts + 1`.
  - Return remaining attempts in error message.
  - Add password length validation (`>= 8`) for signup path.
  **Verify**: 5 wrong guesses → 429 on 6th attempt regardless of correct OTP.

---

### Group B: Plan Limit & Cron Idempotency (SR-016 to SR-018, SR-028 to SR-029)

- [x] T418 Create `backend/supabase/migrations/008_email_sending_status.sql`:
  Drop existing status CHECK constraint, add new one including `'sending'`.
  **Verify**: `INSERT INTO emails (..., status) VALUES (..., 'sending')` succeeds.

- [x] T419 Add `"sending"` to `EmailStatus` in `frontend/types/index.ts`.
  **Verify**: TypeScript compiles without error after the migration.

- [x] T420 Fix `lib/plan-limits.ts` — count both sent (this month) and scheduled/sending (any):
  Replace single sent-count query with two parallel queries; sum the counts.
  **Verify**: Free user with 0 sent + 10 scheduled → assertPlanLimit throws on the 11th schedule attempt.

- [x] T421 Fix `app/api/cron/send-scheduled/route.ts` — atomic claim via `status = 'sending'`:
  Replace fetch-then-update with a single `UPDATE … SET status = 'sending' WHERE status = 'scheduled' … RETURNING *`.
  **Verify**: Two concurrent POST requests to the cron endpoint process disjoint sets of emails.

---

### Group C: Broken Code & Query Safety (SR-019 to SR-021)

- [x] T422 Fix contact route admin notification in `app/api/contact/route.ts`:
  Replace `sendGmail("system", ...)` with `transporter.sendMail(...)` from `lib/email/mailer.ts`.
  Gate behind `APP_NOTIFY_EMAIL && MAILER_USER && MAILER_APP_PASSWORD`.
  **Verify**: With env vars set, contact submission triggers an email to `APP_NOTIFY_EMAIL`.

- [x] T423 Cap dashboard stats emails query in `app/api/dashboard/stats/route.ts`:
  Add `.limit(500)` to the `allSentResult` query.
  **Verify**: Route responds in < 1s even when test user has many sent emails.

- [x] T424 Cap client history emails query in `app/api/clients/[id]/route.ts`:
  Add `.limit(100)` to the client emails fetch.
  **Verify**: Client detail page loads with max 100 email history entries.

---

### Group D: Input Validation & OAuth Safety (SR-022 to SR-024)

- [x] T425 Validate PDF magic bytes in `app/api/documents/upload/route.ts`:
  Read buffer first, then `buffer.slice(0, 4).toString("ascii") === "%PDF"` → 400 if not PDF.
  Remove the now-redundant `file.type / filename.endsWith` MIME check.
  **Verify**: Sending a `.pdf`-named `.html` file → 400 "Only PDF files are accepted."

- [x] T426 Validate `next` param in `app/api/auth/callback/route.ts`:
  `rawNext.startsWith("/") && !rawNext.startsWith("//")` — otherwise use `/dashboard`.
  **Verify**: `?next=//evil.com` → redirects to `/dashboard` not `//evil.com`.

- [x] T427 Add `sameSite: "lax"` to Gmail PKCE cookies in `app/api/gmail/connect/route.ts`.
  **Verify**: Response `Set-Cookie` headers include `SameSite=Lax`.

---

### Group E: Credential Hygiene (SR-025 to SR-026)

- [x] T428 Remove hardcoded credentials from `frontend/scripts/delete-all-users.mjs`:
  Read `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.SUPABASE_SERVICE_ROLE_KEY`.
  Exit with clear message if either is missing.
  **Verify**: Running without env vars → prints error and exits with code 1.

- [x] T429 Document missing env vars in `frontend/.env.example`:
  Add `MAILER_USER`, `MAILER_APP_PASSWORD` (with App Password instructions),
  and `APP_NOTIFY_EMAIL` (optional, with comment).
  **Verify**: A fresh clone can set up all required env vars using `.env.example` alone.

---

## Acceptance Checklist

### Phase 1
- [x] Email with `\r\n` in subject sends cleanly without injected headers
- [x] Free-plan user at limit gets 402 on retry
- [x] Contact form returns 429 on 6th submission (same email, within 60 min)
- [x] AI detect-type returns 400 on 10,001-char input
- [x] Supabase anon key cannot read `contacts` table (403)
- [x] AI generation works with only `OPENROUTER_API_KEY`
- [x] `curl -I http://localhost:3000/` returns all 6 security headers

### Phase 2
- [x] 6th wrong OTP → 429; correct OTP after reset → 200
- [x] 6th OTP send request in 10 min → 429
- [x] Free user with 10 scheduled emails → 402 on 11th schedule attempt
- [x] Concurrent cron calls process disjoint email sets (no duplicates)
- [x] Contact form notification uses SMTP transporter, not user Gmail token
- [x] Dashboard stats responds < 1s for any user
- [x] `.pdf`-named HTML file → 400 on upload
- [x] `?next=//evil.com` → redirects to `/dashboard`
- [x] PKCE cookies include `SameSite=Lax`
- [x] `delete-all-users.mjs` fails gracefully without env vars
- [x] `.env.example` documents `MAILER_USER` and `MAILER_APP_PASSWORD`
