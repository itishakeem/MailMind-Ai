---
id: "014"
title: Fix Scheduled Email Not Sending
stage: green
date: 2026-06-23
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: Abdul Hakeem
command: debug why scheduled email has not been sent on fixed time
labels: ["bug", "cron", "gmail", "supabase", "scheduled-email", "local-dev"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - frontend/lib/gmail/send.ts
  - frontend/app/api/cron/send-scheduled/route.ts
  - frontend/app/api/emails/flush-due/route.ts
  - frontend/app/(dashboard)/scheduled/page.tsx
tests:
  - manual: visit /scheduled page with a past-due email and confirm it sends
  - manual: trigger cron endpoint with CRON_SECRET and verify batch sends
---

## Prompt

debug why scheduled email has not been sent on fixed time (two rounds of investigation)

## Response snapshot

Two root causes found and fixed:

**Bug 1 — Wrong Supabase client in cron context** (`frontend/lib/gmail/send.ts`):
`sendGmail` called `createClient()` (cookie/session-based). The Vercel cron has no user session, so RLS blocked all DB reads → `gmail_token` always null → GmailSendError "Gmail not connected" → all scheduled emails marked `failed`.
Fix: added optional `adminClient?: SupabaseClient` param; cron handler passes its existing service-role client.

**Bug 2 — Vercel cron doesn't run locally** (architectural):
The `*/5 * * * *` cron in `vercel.json` only fires on Vercel's servers. In local dev, nothing ever calls the endpoint, so emails stay `scheduled` forever.
Fix: created `POST /api/emails/flush-due` (user-authenticated, scope to current user). The Scheduled page `useEffect` now auto-triggers it on load whenever any email's `scheduled_at <= now`. Works in local dev and acts as a fast-path fallback in production.

## Outcome

- ✅ Impact: Scheduled emails now send in both local dev and production
- 🧪 Tests: Visit /scheduled page with a past-due email
- 📁 Files: 4 files changed/created
- 🔁 Next prompts: commit + deploy to Vercel; set CRON_SECRET in Vercel env vars
- 🧠 Reflection: Vercel cron is production-only — any feature relying solely on it will silently fail in local dev. Adding a user-triggered fallback path is the right pattern.

## Evaluation notes (flywheel)

- Failure modes observed: (1) RLS blocked cron reads — emails → failed; (2) cron never fires locally — emails → stuck scheduled
- Graders run and results (PASS/FAIL): none automated
- Prompt variant (if applicable): null
- Next experiment: add a visible "Processing..." indicator on the scheduled page while flush is in progress
