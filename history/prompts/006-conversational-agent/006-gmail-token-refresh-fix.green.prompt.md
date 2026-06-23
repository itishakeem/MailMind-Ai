---
id: "006"
title: "Gmail Token Refresh Error Logging"
stage: green
date: 2026-06-22
surface: agent
model: claude-sonnet-4-6
feature: "006-conversational-agent"
branch: main
user: Abdul Hakeem
command: general
labels: ["gmail", "token-refresh", "debugging", "error-handling"]
links:
  spec: specs/006-conversational-agent/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - frontend/lib/gmail/send.ts
tests:
  - "No test suite change — runtime error fix"
---

## Prompt

Gmail send failed — Gmail token refresh failed. Please reconnect Gmail in Settings.

## Response snapshot

Diagnosed the Gmail token refresh failure in `frontend/lib/gmail/send.ts`.

**Root cause**: The Google OAuth refresh token has expired or been revoked. Most common causes:
1. Google Cloud app is in "Testing" mode — refresh tokens expire after 7 days
2. User revoked Gmail access in Google Account settings
3. GOOGLE_CLIENT_ID/SECRET mismatch between environments

**Code improvement made** — `refreshAccessToken()` now:
- Reads the Google API error response body (was silently discarding it)
- Logs the actual Google error code + description via `console.error` for server-side debugging
- Detects `invalid_grant` specifically and shows a clearer user message: "Gmail access has expired or been revoked"
- Falls back to the generic message for other error codes

**User action needed**: Reconnect Gmail in Settings. The token is genuinely expired/revoked — this is not a code bug.

## Outcome

- ✅ Impact: Better error visibility; `invalid_grant` now surfaces a distinct, actionable message
- 🧪 Tests: Runtime fix — no automated test change
- 📁 Files: frontend/lib/gmail/send.ts (refreshAccessToken, 3-line change)
- 🔁 Next prompts: User may need to check Google Cloud Console app status (Testing vs Production)
- 🧠 Reflection: The error was already handled correctly; improvement is diagnostic (server logs) + UX (clearer message for the most common case)

## Evaluation notes (flywheel)

- Failure modes observed: Token refresh silently fails with no server log — impossible to diagnose in production
- Graders run and results (PASS/FAIL): TypeScript unchanged — no compile-time check needed
- Prompt variant (if applicable): n/a
- Next experiment: Check Google Cloud Console → OAuth consent screen status (Testing vs Production)
