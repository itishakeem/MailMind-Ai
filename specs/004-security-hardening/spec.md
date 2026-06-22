# Feature Specification: Security Hardening & Production Readiness

**Feature Branch**: `004-security-hardening`
**Created**: 2026-06-16
**Last Updated**: 2026-06-18 (Phase 2 — deep audit findings)
**Status**: Active

## Context

A two-phase security audit was conducted before production launch.

**Phase 1** (2026-06-16): 9 critical/high issues from initial review.
**Phase 2** (2026-06-18): Deep analysis uncovered 18 additional findings covering
OTP brute-force, plan limit bypasses, cron idempotency, broken notification code,
unbounded queries, file-upload spoofing, and missing secret hygiene.

All findings are captured as requirements below and are traceable to tasks.

---

## Scenarios

### Scenario 1 — Email Header Injection Blocked (P0)
Subject `"Invoice\r\nBcc: hacker@evil.com"` → sends cleanly; no injected headers.

### Scenario 2 — Plan Limit Enforced on Retry (P0)
Free-plan user at 10/10 emails → POST `/api/emails/{id}/retry` → 402 with `upgrade_url`.

### Scenario 3 — Contact Form Rate Limited (P1)
6th submission with same email within 60 min → 429 with `Retry-After: 3600`.

### Scenario 4 — Password Reset Rate Limited (P1)
6th reset POST for same email within 15 min → no further email sent (silent 200).

### Scenario 5 — AI Abuse Prevented via Length Cap (P1)
`text` > 10,000 chars to `/api/ai/detect-type` or `/api/ai/generate` → 400 before AI call.

### Scenario 6 — Oversized Email Payload Rejected (P1)
Subject > 998 chars or body > 50,000 chars to send/schedule → 400.

### Scenario 7 — Security Headers Present (P1)
`curl -I <production>/` returns: `X-Frame-Options`, `X-Content-Type-Options`,
`Strict-Transport-Security`, `Content-Security-Policy`, `Referrer-Policy`,
`Permissions-Policy`.

### Scenario 8 — contacts Table Locked Down (P1)
Anon-key GET to `/rest/v1/contacts` → HTTP 403.

### Scenario 9 — AI Fallback Uses OpenRouter Free Model (P1)
Gemini Flash timeout → generation succeeds via `nvidia/nemotron-3-super-120b-a12b:free`.

### Scenario 10 — OTP Brute-Force Blocked (P0)
6th incorrect OTP attempt on the same token → 429 and token is invalidated.

### Scenario 11 — OTP Request Spam Blocked (P0)
6th OTP send request for the same email within 10 minutes → 429.

### Scenario 12 — Plan Limit Bypassed via Scheduled Emails (P0)
Free user with 0 sent emails schedules 10 emails simultaneously → only first batch
may succeed; subsequent calls return 402 once the combined sent + scheduled count
reaches the plan cap.

### Scenario 13 — Cron Duplicate Send Prevented (P0)
Two cron instances running concurrently → each scheduled email is delivered exactly once.

### Scenario 14 — Contact Notification Functional (P1)
With `APP_NOTIFY_EMAIL` + `MAILER_*` set, a contact submission triggers an admin email
via SMTP. Gmail user tokens are NOT used for system notifications.

### Scenario 15 — Non-PDF Upload Rejected by Content (P1)
A `.pdf`-named file with HTML magic bytes → 400 "Only PDF files are accepted."

### Scenario 16 — OAuth Callback Next-Param Safe (P1)
`/api/auth/callback?next=//evil.com` → redirects to `/dashboard`, not `//evil.com`.

### Scenario 17 — Hardcoded Credentials Removed (P0)
`frontend/scripts/delete-all-users.mjs` reads credentials from environment variables,
not hardcoded strings. Running without env vars set exits with a clear error.

### Scenario 18 — Dashboard Stats Does Not OOM (P1)
A user with 50,000+ sent emails hitting `/api/dashboard/stats` → responds within
normal latency; server does not load unbounded rows.

---

## Requirements

### Phase 1 (Original)

- **SR-001**: `buildRawMessage` MUST strip `\r`/`\n` from `to` and `subject`.
- **SR-002**: Retry endpoint MUST call `assertPlanLimit` before `sendGmail`.
- **SR-003**: `/api/contact` MUST limit to 5 submissions/email/hour → 429.
- **SR-004**: `/api/auth/password-reset` MUST limit to 5 requests/email/15 min (silent skip, no 429 to client).
- **SR-005**: All responses MUST include 6 security headers (X-Frame-Options, X-Content-Type-Options, HSTS, CSP, Referrer-Policy, Permissions-Policy).
- **SR-006**: `contacts` table MUST have RLS enabled with no permissive policies.
- **SR-007**: AI text inputs capped at 10,000 chars → 400 before AI call.
- **SR-008**: Email subject ≤ 998 chars, body ≤ 50,000 chars → 400.
- **SR-009**: AI fallback model MUST be `nvidia/nemotron-3-super-120b-a12b:free` via OpenRouter.
- **SR-010**: `nvidiaClient()` using `NVIDIA_API_KEY` MUST be removed.
- **SR-011**: AI errors classified into `auth_error | rate_limit | timeout | parse_error | upstream_error` with structured logs.

### Phase 2 (Deep Audit)

- **SR-012**: OTP MUST be generated with `crypto.randomInt()`, NOT `Math.random()`.
- **SR-013**: `/api/auth/send-otp` MUST rate-limit to 5 requests/email/10 min → 429.
- **SR-014**: `/api/auth/verify-otp` MUST lock out after 5 failed attempts → 429 and delete token.
- **SR-015**: OTP comparison MUST use `crypto.timingSafeEqual()` to prevent timing attacks.
- **SR-016**: `assertPlanLimit` for `email_send` MUST count `status IN ('scheduled','sending')` + `sent` this month to prevent the simultaneous-schedule bypass.
- **SR-017**: Cron job MUST atomically claim rows (`status = 'sending'`) before sending to prevent duplicate delivery across concurrent instances.
- **SR-018**: `email_signature` type 'sending' MUST be added to the emails status CHECK constraint via migration.
- **SR-019**: `/api/contact` notification MUST use the SMTP `transporter`, NOT `sendGmail` with a fake userId.
- **SR-020**: `/api/dashboard/stats` emails aggregation query MUST include `.limit(500)`.
- **SR-021**: `/api/clients/[id]` email history query MUST include `.limit(100)`.
- **SR-022**: `/api/documents/upload` MUST validate PDF magic bytes (`%PDF`) from the raw buffer, not from browser-reported MIME or filename.
- **SR-023**: `/api/auth/callback` MUST validate that the `next` param starts with `/` and not `//`.
- **SR-024**: Gmail PKCE cookies MUST include `sameSite: "lax"` attribute.
- **SR-025**: `frontend/scripts/delete-all-users.mjs` MUST read credentials from env vars; no hardcoded secrets.
- **SR-026**: `.env.example` MUST document `MAILER_USER`, `MAILER_APP_PASSWORD`, and `APP_NOTIFY_EMAIL`.
- **SR-027**: `otp_tokens` table MUST have an `attempts INTEGER NOT NULL DEFAULT 0` column.
- **SR-028**: `emails` status CHECK constraint MUST include `'sending'` as a valid value.
- **SR-029**: `types/index.ts` `EmailStatus` MUST include `"sending"`.

## Success Criteria

- **SC-001**: All 18 Phase-2 scenarios pass.
- **SC-002**: `curl -I <production-url>/` returns all 6 security headers.
- **SC-003**: AI generation works with only `OPENROUTER_API_KEY` (no NVIDIA key).
- **SC-004**: No regression in auth, compose, schedule, dashboard, or Gmail flows.
- **SC-005**: Zero hardcoded secrets in any committed file.
- **SC-006**: 6-digit OTP with 5 wrong guesses → token locked; correct guess after reset → success.
