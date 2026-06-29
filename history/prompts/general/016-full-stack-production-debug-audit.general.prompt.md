---
id: "016"
title: Full-Stack Production Debug & Audit
stage: general
date: 2026-06-25
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: Abdul Hakeem
command: "debug entire system frontend backend api routing credentials for production saas vercel deploy"
labels: ["debug", "production", "security", "cron", "bug-fix", "type-safety", "api", "vercel"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - frontend/app/api/ai/detect-type/route.ts
  - frontend/app/api/cron/send-scheduled/route.ts
  - frontend/app/api/emails/flush-due/route.ts
  - frontend/app/api/payments/webhook/route.ts
  - frontend/app/api/settings/signature/route.ts
  - frontend/app/api/auth/password-reset/route.ts
  - frontend/app/(dashboard)/settings/page.tsx
  - frontend/app/auth/verify-otp/page.tsx
  - frontend/types/index.ts
  - frontend/.env.example
tests:
  - build: npx tsc --noEmit (exit 0)
  - build: npx next build (production build pass)
  - manual: email type detection now works end-to-end in ComposeWizard
  - manual: scheduled email not double-sent when two cron invocations overlap
  - manual: signature textarea pre-fills with existing value on Settings page load
---

## Prompt

now you are a senior full stack ai engineer your task is to deug thw entire system, frontend, backend and api routing also credentails. keep this project clean error handling fallbacks make it for production saas. fix bugs if you found any then in last summarize what was changes and we will deploy it on vercel.

## Response snapshot

Full audit of all frontend pages, API routes, lib utilities, middleware, and config. 8 bugs found and fixed:

**Critical**
1. **detect-type field mismatch** (`app/api/ai/detect-type/route.ts`) — API returned `{ type }` but ComposeWizard read `data.detected_type`. Type detection was always silently failing, defaulting to "invoice". Fixed: return `{ detected_type, confidence }` to match the frontend and `AIDetectTypeResult` interface.

2. **Cron double-send race** (`app/api/cron/send-scheduled/route.ts`) — Comment claimed atomic claiming was implemented but code was missing it entirely. Two simultaneous cron fires could double-send the same email. Fixed with two-step atomic claim: SELECT candidate IDs, then UPDATE WHERE status='scheduled' AND id IN (ids) — concurrent instance gets empty RETURNING result.

3. **Webhook spoofable** (`app/api/payments/webhook/route.ts`) — `LEMONSQUEEZY_WEBHOOK_SECRET ?? ""` meant any attacker could forge webhooks by computing HMAC with empty key if env var not set. Fixed: early-return 500 when secret not configured.

**High**
4. **Settings signature not loaded** (`app/(dashboard)/settings/page.tsx`) — Page initialised `signature` state to `""` but never fetched existing value. Saving overwrote DB value with empty string. Fixed: added `useEffect` to fetch `/api/profile` and seed state.

**Medium**
5. **AIGenerateResult type stale** (`types/index.ts`) — `model_used: "nemotron-free" | "none"` but actual values are `"gemini-flash" | "openrouter-auto"`. Fixed.

6. **Signature no Pro gate** (`app/api/settings/signature/route.ts`) — Free users could save signatures (inconsistent with profile PATCH and sendGmail logic). Fixed: added plan check.

7. **password-reset wrong redirect** (`app/api/auth/password-reset/route.ts`) — Redirected to `/auth/reset-password` (non-existent page). Fixed to `/auth/set-password`.

**Build-blocking**
8. **React hooks violation** (`app/auth/verify-otp/page.tsx`) — `useRef` called inside `Array.from` callback, violating Rules of Hooks. Fixed: replaced with `useRef<Array<HTMLInputElement | null>>([...])` and callback refs in JSX.

Also applied: atomic claiming to `flush-due`, CRON_SECRET guard, `.env.example` updated with `OPENROUTER_API_KEY_FREE` and current model names.

TypeScript: exit 0. Production build: passes.

## Outcome

All 8 bugs fixed. Production build clean. App is Vercel-ready pending correct env vars (see Vercel deploy checklist in memory/project_debug_sprint_005.md).

## Next steps

- Set all production env vars in Vercel dashboard (especially `GMAIL_REDIRECT_URI`, `ENCRYPTION_KEY`, `CRON_SECRET`, `LEMONSQUEEZY_WEBHOOK_SECRET`)
- Set Vercel "Root Directory" to `frontend`
- Run `vercel deploy --prod`
