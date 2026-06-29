---
id: "018"
title: Remove Auth Redirect on Login Page
stage: green
date: 2026-06-29
surface: agent
model: claude-sonnet-4-6
feature: none
branch: 001-admin-analytics-dashboard
user: Abdul Hakeem
command: user-message
labels: ["auth", "middleware", "session", "login", "redirect"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - frontend/middleware.ts
tests:
  - none
---

## Prompt

one issue, when user comeback and login it redirect to dashboard. it should again enter email and password

## Response snapshot

Removed the `isAuthRoute && user` redirect block from `frontend/middleware.ts` (lines 54–63). Authenticated users visiting `/auth/login` or `/auth/signup` were being silently redirected to `/dashboard`. Removing the block lets them see the login form and re-enter credentials, which Supabase handles by creating a fresh session on submit.

## Outcome

- ✅ Impact: Authenticated users can now visit `/auth/login` and re-authenticate without being auto-redirected; session is replaced on successful sign-in.
- 🧪 Tests: none
- 📁 Files: frontend/middleware.ts (removed 10-line redirect block)
- 🔁 Next prompts: If session persistence is a broader concern, configure Supabase cookie expiry or add a server-side sign-out on login page mount.
- 🧠 Reflection: The redirect was standard UX for single-device apps but inappropriate when users want to switch accounts or re-authenticate on shared devices.

## Evaluation notes (flywheel)

- Failure modes observed: None — change was a clean deletion with no side effects on protected routes.
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): Test that `/dashboard` still redirects unauthenticated users to login (protected route guard is untouched).
