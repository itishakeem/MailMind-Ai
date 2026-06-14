---
id: "005"
title: Phase 2 Auth Gmail Connection
stage: green
date: 2026-06-12
surface: agent
model: claude-sonnet-4-6
feature: 001-mailmind-ai
branch: 001-mailmind-ai
user: Abdul Hakeem
command: /sp.implement
labels: ["green","phase-2","auth","gmail-oauth","pkce","aes-256-gcm","next.js","supabase"]
links:
  spec: specs/001-mailmind-ai/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - app/(auth)/layout.tsx
  - app/(auth)/signup/page.tsx
  - app/(auth)/login/page.tsx
  - app/(dashboard)/layout.tsx
  - app/(dashboard)/dashboard/page.tsx
  - app/(dashboard)/settings/page.tsx
  - app/page.tsx
  - app/api/auth/callback/route.ts
  - app/api/auth/logout/route.ts
  - app/api/gmail/connect/route.ts
  - app/api/gmail/callback/route.ts
  - app/api/gmail/disconnect/route.ts
  - app/api/gmail/status/route.ts
  - components/auth/SignupForm.tsx
  - components/auth/LoginForm.tsx
  - components/auth/GoogleSignInButton.tsx
  - components/layout/Navbar.tsx
  - components/layout/Sidebar.tsx
  - lib/gmail/send.ts
  - specs/001-mailmind-ai/tasks.md
tests:
  - npx tsc --noEmit (PASS — 1 error fixed: Supabase .select() args on update chain)
---

## Prompt

/sp.implement execute phase 2 from tasks.md

## Response snapshot

Executed all 18 Phase 2 tasks (T014–T031) for US1 (Auth & Gmail Connection).

**Auth pages**: SignupForm + LoginForm (controlled, with inline errors) + GoogleSignInButton
(Supabase OAuth). Auth layout is a centered card. Signup routes to /settings on success
(Gmail connect prompt); login routes to /dashboard.

**API routes**: Supabase OAuth callback (exchanges code, detects new vs returning user),
logout, Gmail PKCE connect (builds Google OAuth URL with code_verifier + state cookies),
Gmail callback (validates state, exchanges code+verifier for tokens, encrypts with
AES-256-GCM, stores in Supabase), Gmail disconnect (revokes token, marks scheduled emails
failed with failure_reason='gmail_disconnected'), Gmail status.

**Gmail send lib** (lib/gmail/send.ts): Decrypts token, builds RFC 2822 message, calls
googleapis. Proactive refresh if token expires within 5 min. On 401 mid-flight: one
refresh + retry. Throws GmailSendError on all failures.

**Layout components**: Navbar (logo, Gmail status indicator, plan badge, logout), Sidebar
(5 nav items with active highlight via usePathname). Dashboard layout is a Server Component
that verifies auth, fetches user profile, passes User to Navbar.

**Pages**: Full landing page (hero, 6 features, 3 pricing cards), settings page (Gmail
connect/disconnect + email signature), dashboard placeholder.

TypeScript bug fixed: `.select("id", { count, head })` is invalid on an update chain —
split into separate count query + update call.

All T014–T031 marked [x] in tasks.md.

## Outcome

- ✅ Impact: Full auth flow (signup/login/Google OAuth/Gmail connect/disconnect) implemented;
  protected dashboard layout; landing page with pricing; tsc --noEmit PASS.
- 🧪 Tests: npx tsc --noEmit → PASS (0 errors)
- 📁 Files: 20 files created/modified
- 🔁 Next prompts: `/sp.implement execute phase 3` to build client management
- 🧠 Reflection: The two-OAuth distinction is the key implementation subtlety — Supabase
  Google OAuth (login) vs Gmail API OAuth (send). Both flows are present and separated:
  /api/auth/callback handles Supabase auth; /api/gmail/connect+callback handles Gmail send.

## Evaluation notes (flywheel)

- Failure modes observed: Supabase JS `.select()` with count options is not valid on
  an update builder — must use a separate select query for counting
- Graders run and results (PASS/FAIL): tsc --noEmit → PASS
- Prompt variant (if applicable): n/a
- Next experiment: add `npm run build` dry-run check to catch Server/Client Component
  boundary issues before deploying
