---
id: "020"
title: Create Separate Admin Account Bootstrap
stage: green
date: 2026-06-29
surface: agent
model: claude-sonnet-4-6
feature: none
branch: 001-admin-analytics-dashboard
user: Abdul Hakeem
command: user-message
labels: ["auth", "admin", "rbac", "bootstrap", "supabase"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - frontend/setup-admin.mjs
tests:
  - none
---

## Prompt

i have some change leave the existing user as user create manual password and seprate email for admin: abdulhakeem7978@gmail.com. and password:mailmind

## Response snapshot

Created `frontend/setup-admin.mjs` which: (1) calls `supabase.auth.admin.createUser` to create `abdulhakeem7978@gmail.com` with password `mailmind` and email pre-confirmed, (2) upserts the public.users row with `role=super_admin` and `plan=business`, (3) downgrades `itzhakeem1725@gmail.com` back to `role=user`. Script ran successfully — all three steps completed.

## Outcome

- ✅ Impact: Dedicated admin account created; previous user account returned to regular user role.
- 🧪 Tests: none
- 📁 Files: frontend/setup-admin.mjs (created)
- 🔁 Next prompts: Change the admin password after first login via /settings or Supabase dashboard.
- 🧠 Reflection: Separating admin and user accounts is the right security pattern — avoids conflating personal user data with admin privileges.

## Evaluation notes (flywheel)

- Failure modes observed: None — script succeeded on first run.
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): Add a `--reset-password` flag to setup-admin.mjs for future credential rotation.
