---
id: "021"
title: Redirect Admin Login to Admin Dashboard
stage: green
date: 2026-06-29
surface: agent
model: claude-sonnet-4-6
feature: none
branch: 001-admin-analytics-dashboard
user: Abdul Hakeem
command: user-message
labels: ["auth", "login", "redirect", "rbac", "admin"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - frontend/components/auth/LoginForm.tsx
  - frontend/app/auth/login/page.tsx
tests:
  - none
---

## Prompt

the new admin should redirect to admin dashboard. when logged in

## Response snapshot

Updated `LoginForm.tsx`: after successful sign-in, fetches the user's role from `public.users`. If role >= `support`, redirects to `/admin`; otherwise to `/dashboard`. Also honours any `?redirectTo` param set by the middleware. Added a `<Suspense>` wrapper in `login/page.tsx` as required by `useSearchParams`.

## Outcome

- ✅ Impact: Admin users land on `/admin` after login; regular users still go to `/dashboard`; middleware-set redirectTo params are honoured for both.
- 🧪 Tests: none
- 📁 Files: frontend/components/auth/LoginForm.tsx, frontend/app/auth/login/page.tsx
- 🔁 Next prompts: Apply the same role-aware redirect in GoogleSignInButton callback if Google OAuth is used by admins.
- 🧠 Reflection: The role check is a single extra query after login — negligible cost for a correct post-login destination.

## Evaluation notes (flywheel)

- Failure modes observed: None.
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): Cache role in Supabase user_metadata on login to avoid the profile query on subsequent page loads.
