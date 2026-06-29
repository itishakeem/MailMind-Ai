---
id: "019"
title: Admin-Only Re-Auth on Login Page
stage: green
date: 2026-06-29
surface: agent
model: claude-sonnet-4-6
feature: none
branch: 001-admin-analytics-dashboard
user: Abdul Hakeem
command: user-message
labels: ["auth", "middleware", "rbac", "session", "login"]
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

now remove the existing user just make it only admin

## Response snapshot

Updated the `isAuthRoute` block in `frontend/middleware.ts`. Regular users (role = "user") visiting `/auth/login` while already authenticated are still auto-redirected to `/dashboard`. Admin-level users (support, moderator, admin, super_admin) are allowed through to the login form so they can re-authenticate.

## Outcome

- ✅ Impact: Re-authentication on login page is now admin-only. Regular users retain the convenient auto-login redirect.
- 🧪 Tests: none
- 📁 Files: frontend/middleware.ts
- 🔁 Next prompts: Consider caching the role in a short-lived cookie to avoid the extra DB query on every auth-route visit.
- 🧠 Reflection: Separating re-auth behavior by role is a clean security pattern — admins benefit from forced re-authentication while regular users get seamless UX.

## Evaluation notes (flywheel)

- Failure modes observed: None.
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): Store role in Supabase JWT custom claim to eliminate the per-request DB lookup.
