---
description: "Implementation tasks for MailMind AI — Full Product"
---

# Tasks: MailMind AI — Full Product

**Input**: Design documents from `/specs/001-mailmind-ai/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅
**Branch**: `001-mailmind-ai`
**Stack**: TypeScript 5, Next.js 14 App Router, Tailwind CSS, Supabase PostgreSQL, Gmail API,
OpenRouter (Gemini Flash), NVIDIA NIM (Nemotron 3), pdf-parse, Vercel Cron

**Organization**: 5 phases — Setup+Foundation → Auth+Gmail → Clients → AI+Email+Schedule → Dashboard+Polish
**Total tasks**: 73 | **Parallelizable**: 40 | **Sequential**: 33

---

## Phase 1: Setup & Foundational Infrastructure

**Purpose**: Project initialization, database schema, shared utilities. No user story work
begins until this phase is complete.

**⚠️ CRITICAL**: All Phase 2+ tasks depend on this phase completing first.

- [x] T001 Initialize Next.js 14 project with TypeScript: `npx create-next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias="@/*"`
- [x] T002 [P] Install all dependencies: `npm install @supabase/ssr @supabase/supabase-js googleapis @google-cloud/local-auth openai pdf-parse zod` and dev deps `@types/pdf-parse`
- [x] T003 [P] Create `types/index.ts` with all TypeScript interfaces: `User`, `Client`, `Email`, `Document`, `Plan`, `EmailStatus`, `EmailType`, `Tone`, `PlanLimits`, `PLAN_LIMITS` constant — derived from `specs/001-mailmind-ai/data-model.md`
- [x] T004 [P] Create `.env.example` documenting all required variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GMAIL_REDIRECT_URI`, `OPENROUTER_API_KEY`, `NVIDIA_API_KEY`, `ENCRYPTION_KEY`, `CRON_SECRET`
- [x] T005 Create `supabase/migrations/001_initial_schema.sql` with full DDL for tables `users`, `clients`, `emails`, `documents` — exact SQL from `specs/001-mailmind-ai/data-model.md` including all CHECK constraints, indexes, and `client_snapshot JSONB` column
- [x] T006 Create `supabase/migrations/002_rls_policies.sql` with all RLS policies: enable RLS + `auth.uid() = user_id` policies on all 4 tables — from `specs/001-mailmind-ai/data-model.md`
- [x] T007 Create `supabase/migrations/003_auth_trigger.sql`: PostgreSQL trigger on `auth.users` INSERT that auto-inserts a row into `public.users` with `id`, `name` (from raw_user_meta_data), `email`, `plan='free'`
- [x] T008 [P] Create `lib/supabase/client.ts`: browser-side Supabase singleton using `createBrowserClient` from `@supabase/ssr`
- [x] T009 [P] Create `lib/supabase/server.ts`: server-side Supabase client using `createServerClient` from `@supabase/ssr` with Next.js cookie handling for Route Handlers and Server Components
- [x] T010 Create `middleware.ts` at project root: Supabase session refresh middleware using `createServerClient`, applied to all routes under `/(dashboard)` to protect them; redirect unauthenticated users to `/auth/login`
- [x] T011 [P] Create `lib/gmail/oauth.ts`: AES-256-GCM `encryptToken(json: object): string` and `decryptToken(ciphertext: string): object` helpers using Node.js `crypto` module and `ENCRYPTION_KEY` env var; IV stored as `"hex_iv:hex_ciphertext"` format
- [x] T012 [P] Create `lib/plan-limits.ts`: export `assertPlanLimit(supabase, userId, type: 'email_send' | 'client_create'): Promise<void>` that queries current counts and throws `PlanLimitError` (with `limit_type`, `current_count`, `max_allowed`) if exceeded; uses `PLAN_LIMITS` from `types/index.ts`
- [x] T013 Create `vercel.json` with cron job: `{ "crons": [{ "path": "/api/cron/send-scheduled", "schedule": "*/5 * * * *" }] }`

**Checkpoint**: Database migrated, all shared libraries created, no user story code yet.

---

## Phase 2: Authentication & Gmail Connection (US1 — P1) 🎯 MVP Gate

**Goal**: New user can register/login, connect Gmail, and see an empty dashboard. This
gates every other user story — no email can be sent without a connected Gmail account.

**Independent Test**: Open incognito browser → sign up → connect Gmail → dashboard
loads with no errors. Run `quickstart.md` Steps 1–4.

### Implementation for User Story 1

- [x] T014 [P] [US1] Create `app/(auth)/layout.tsx`: centered card layout for auth pages; no sidebar/navbar; Tailwind styling
- [x] T015 [P] [US1] Create `components/auth/SignupForm.tsx`: controlled form with name, email, password fields; calls `supabase.auth.signUp()`; on success redirects to `/settings/gmail` (onboarding step); shows inline validation errors
- [x] T016 [P] [US1] Create `components/auth/LoginForm.tsx`: email + password fields; calls `supabase.auth.signInWithPassword()`; on success redirects to `/dashboard`; "Forgot password?" link to `/auth/reset`
- [x] T017 [P] [US1] Create `components/auth/GoogleSignInButton.tsx`: calls `supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: '/api/auth/callback' })`; renders Google-branded button
- [x] T018 [US1] Create `app/(auth)/signup/page.tsx`: renders `SignupForm` and `GoogleSignInButton`; link to login page
- [x] T019 [US1] Create `app/(auth)/login/page.tsx`: renders `LoginForm` and `GoogleSignInButton`; link to signup page
- [x] T020 [US1] Create `app/api/auth/callback/route.ts`: exchanges Supabase OAuth `code` param for session using `supabase.auth.exchangeCodeForSession()`; redirects to `/settings/gmail` for new users or `/dashboard` for returning users
- [x] T021 [US1] Create `app/api/auth/logout/route.ts`: calls `supabase.auth.signOut()`; clears session cookie; redirects to `/auth/login`
- [x] T022 [US1] Create `app/api/gmail/connect/route.ts`: builds Google OAuth 2.0 URL with scope `https://www.googleapis.com/auth/gmail.send`, PKCE challenge, and `state` CSRF token stored in session; redirects user to Google consent screen
- [x] T023 [US1] Create `app/api/gmail/callback/route.ts`: validates `state` CSRF param; exchanges `code` for `{access_token, refresh_token}` using Google token endpoint; encrypts token JSON with `encryptToken()`; updates `users.gmail_token` and `users.gmail_email` in Supabase; redirects to `/dashboard?gmail=connected`
- [x] T024 [US1] Create `app/api/gmail/disconnect/route.ts`: calls Google OAuth revoke endpoint for the access token; sets `users.gmail_token = NULL` and `users.gmail_email = NULL`; updates all `emails` with `status = 'scheduled'` for this user to `status = 'paused'` (add 'paused' to status enum or set `failure_reason = 'gmail_disconnected'`); returns `{ paused_count }`
- [x] T025 [P] [US1] Create `app/api/gmail/status/route.ts`: returns `{ connected: boolean, gmail_email: string | null }` from `users` table for authenticated user
- [x] T026 [US1] Create `lib/gmail/send.ts`: export `sendGmail(userId, to, subject, body): Promise<{ messageId: string }>` that decrypts token, calls `gmail.users.messages.send()` via googleapis, handles token refresh (updates DB with new access token on 401), throws `GmailSendError` on failure
- [x] T027 [P] [US1] Create `components/layout/Navbar.tsx`: top navigation with MailMind AI logo, user menu (avatar + plan badge + logout); shows Gmail connection status indicator
- [x] T028 [P] [US1] Create `components/layout/Sidebar.tsx`: left sidebar with nav links to Dashboard, Compose, Clients, Scheduled, Settings; highlights active route; collapses on mobile
- [x] T029 [US1] Create `app/(dashboard)/layout.tsx`: server component; verifies auth via `supabase.auth.getUser()`; redirects to `/auth/login` if not authenticated; renders `Navbar` + `Sidebar` + `{children}`
- [x] T030 [US1] Create `app/(dashboard)/settings/page.tsx`: shows Gmail connection section with "Connect Gmail" button (if disconnected) or connected Gmail address + "Disconnect" button (if connected); calls `/api/gmail/status` on load; email signature text area (saves to `users.email_signature`)
- [x] T031 [US1] Create `app/page.tsx`: landing page with hero section ("Your Work. Your Email. AI-Powered."), features grid (6 competitive advantages from project doc), pricing cards (Free/Pro/Business), CTA button linking to `/auth/signup`

**Checkpoint**: Full auth flow working. User can register, connect Gmail, and land on
an empty dashboard. All protected routes redirect unauthenticated users.

---

## Phase 3: Client Management (US2 — P2)

**Goal**: Authenticated user can add, view, edit, and delete clients. Free plan limit of
3 clients enforced server-side. Per-client email history visible (empty at this stage).

**Independent Test**: Log in (no Gmail required) → add 3 clients → attempt 4th (blocked
with 402) → edit one → delete one → view history (empty list). Run `quickstart.md` Steps 5–7.

### Implementation for User Story 2

- [x] T032 [P] [US2] Create `app/api/clients/route.ts`: `GET` returns all clients for `auth.uid()` ordered by `created_at DESC`; `POST` calls `assertPlanLimit(supabase, userId, 'client_create')`, validates name+email, inserts into `clients` table, returns 201 with new client
- [x] T033 [P] [US2] Create `app/api/clients/[id]/route.ts`: `GET` fetches client row + all associated `emails` rows ordered by `created_at DESC` (for history); `PUT` updates allowed fields (name, email, phone, company, address); `DELETE` deletes client row (emails retained via `ON DELETE SET NULL`)
- [x] T034 [P] [US2] Create `components/clients/ClientForm.tsx`: reusable form for add/edit; fields: name (required), email (required with format validation), phone, company, address (all optional); submit calls POST or PUT; shows field-level errors from API
- [x] T035 [P] [US2] Create `components/clients/ClientCard.tsx`: card showing client name, email, company; last email date and count badge; click navigates to `/clients/[id]`; delete button with confirmation modal
- [x] T036 [P] [US2] Create `components/clients/ClientHistory.tsx`: chronological table of email records for a client; columns: Subject, Type badge, Status badge, Date; empty state message "No emails sent yet"
- [x] T037 [US2] Create `app/(dashboard)/clients/page.tsx`: fetches client list via `/api/clients`; renders `ClientCard` grid; "Add Client" button opens `ClientForm` in a modal; shows plan usage chip ("2 / 3 clients used" for free plan)
- [x] T038 [US2] Create `app/(dashboard)/clients/[id]/page.tsx`: fetches client detail + history via `/api/clients/[id]`; renders client detail panel with `ClientForm` (edit mode) and `ClientHistory`; "Compose Email" button links to `/compose?clientId=[id]`

**Checkpoint**: Full client CRUD working. Free plan limit blocks 4th client. Client history
shows empty list (emails not yet implemented). US2 independently testable.

---

## Phase 4: AI Email Generation, Immediate Send & Scheduling (US3+US4 — P3+P4)

**Goal**: User selects client, provides PDF or text, AI detects type, generates email
preview, user edits and sends immediately OR schedules for future delivery. Cron job
delivers scheduled emails automatically.

**Independent Test (US3)**: Compose → upload PDF → confirm type → select Formal → send →
email arrives in Gmail Sent + client history updated. Run `quickstart.md` Steps 8–12.

**Independent Test (US4)**: Schedule email 3 min in future → wait → verify delivered in
Gmail Sent + status changed to "sent". Run `quickstart.md` Steps 13–15.

### Shared AI & PDF Infrastructure

- [x] T039 [P] [US3] Create `lib/pdf/extract.ts`: export `extractPdfText(buffer: Buffer): Promise<string>` using `pdf-parse`; throws `PdfExtractionError` with human-readable message if text is empty (image-only/scanned) or parse fails; limits input to 10 MB
- [x] T040 [P] [US3] Create `lib/ai/prompts.ts`: export `buildDetectTypePrompt(text: string): string` and `buildGenerateEmailPrompt(text: string, type: EmailType, tone: Tone, clientName?: string): string`; generation prompt requests JSON response `{ "subject": "...", "body": "..." }`; system prompt establishes South Asian freelancer context
- [x] T041 [US3] Create `lib/ai/generate.ts`: export `generateEmail(params): Promise<{ subject, body, modelUsed }>` and `detectEmailType(text): Promise<{ type: EmailType, confidence: string }>`; implements two-tier fallback: try OpenRouter (Gemini Flash `google/gemini-flash-1.5`) → on 5xx/429/timeout try NVIDIA NIM (Nemotron `nvidia/nemotron-3-8b-chat-4k-steerlm`) → on both failures throw `AIUnavailableError`; validates JSON response with Zod schema `{ subject: z.string(), body: z.string() }`

### API Routes for US3

- [x] T042 [US3] Create `app/api/documents/upload/route.ts`: parses `multipart/form-data`; validates file is PDF and ≤10 MB; calls `extractPdfText()`; on success inserts into `documents` table (text only, no binary); returns `{ document_id, extracted_text, filename }`; on extraction error returns 400 with `{ error, fallback: 'manual_input' }`
- [x] T043 [US3] Create `app/api/ai/detect-type/route.ts`: accepts `{ text: string }`; calls `detectEmailType(text)` from `lib/ai/generate.ts`; returns `{ detected_type, confidence }`; on `AIUnavailableError` returns 503 with `{ error, fallback_mode: true }`
- [x] T044 [US3] Create `app/api/ai/generate/route.ts`: accepts `{ text, tone, email_type, client_name? }`; calls `generateEmail()` from `lib/ai/generate.ts`; returns `{ subject, body, model_used }`; on `AIUnavailableError` returns 503 with `{ error, fallback_mode: true }`
- [x] T045 [US3] Create `app/api/emails/send/route.ts`: validates body against `EmailSendInput` schema; calls `assertPlanLimit(supabase, userId, 'email_send')`; fetches client to build `client_snapshot`; calls `sendGmail()` from `lib/gmail/send.ts`; inserts email record with `status='sent'`, `sent_at=NOW()`; returns `{ email_id, gmail_message_id }`; on `GmailSendError` returns 503; on `PlanLimitError` returns 402

### UI Components for US3

- [x] T046 [P] [US3] Create `components/compose/PDFUpload.tsx`: drag-and-drop zone + file picker; shows filename + size after selection; upload progress bar; calls `POST /api/documents/upload`; on success emits `{ document_id, extracted_text }` to parent; on error shows "Could not read PDF — please type a description instead"
- [x] T047 [P] [US3] Create `components/compose/ToneSelector.tsx`: three-button toggle group (Friendly / Formal / Strict); emits selected `Tone` value; Formal is default
- [x] T048 [P] [US3] Create `components/compose/TypeBadge.tsx`: displays AI-detected type with colored badge (Invoice=blue, Reminder=orange, Update=green, Proposal=purple) + "Wrong? Change" link that renders a dropdown to override
- [x] T049 [US3] Create `components/compose/AIPreview.tsx`: shows `TypeBadge`, editable subject `<input>`, editable body `<textarea>`; "Regenerate" button (re-calls generate with same params); "Send Now" button; "Schedule" button; when `fallback_mode=true` from API shows banner "AI unavailable — compose manually" and unlocks fields for manual input
- [x] T050 [US3] Create `components/compose/ComposeWizard.tsx`: orchestrates 3-step flow — Step 1: client selector + input method (PDF or text); Step 2: type detection + tone selection + "Generate" button; Step 3: `AIPreview` + send/schedule actions; manages all state (selected client, extracted text, detected type, tone, generated email, edit state); calls all relevant API routes in sequence
- [x] T051 [US3] Create `app/(dashboard)/compose/page.tsx`: reads optional `?clientId=` query param to pre-select a client; renders `ComposeWizard`; on successful send shows success toast and resets wizard

### API Routes for US4

- [x] T052 [US4] Create `app/api/emails/schedule/route.ts`: validates `scheduled_at` is at least 1 minute in the future; calls `assertPlanLimit()`; builds `client_snapshot`; inserts email record with `status='scheduled'`; returns `{ email_id, scheduled_at }`
- [x] T053 [US4] Create `app/api/emails/scheduled/route.ts` (`GET`): returns all emails where `user_id = auth.uid()` AND `status IN ('scheduled', 'failed')` ordered by `scheduled_at ASC`
- [x] T054 [P] [US4] Create `app/api/emails/[id]/reschedule/route.ts` (`PUT`): verifies email belongs to user and has `status='scheduled'`; validates new `scheduled_at` is in the future; updates `scheduled_at`
- [x] T055 [P] [US4] Create `app/api/emails/[id]/cancel/route.ts` (`DELETE`): verifies email belongs to user and has `status='scheduled'`; deletes row (or sets status to 'cancelled' for audit); returns `{ success: true }`
- [x] T056 [P] [US4] Create `app/api/emails/[id]/retry/route.ts` (`POST`): verifies email belongs to user and has `status='failed'`; calls `sendGmail()`; on success updates `status='sent'`, `sent_at=NOW()`, clears `failure_reason`
- [x] T057 [US4] Create `app/api/cron/send-scheduled/route.ts`: validates `Authorization: Bearer ${CRON_SECRET}` header; queries all emails where `status='scheduled'` AND `scheduled_at <= NOW()`; for each: calls `sendGmail()`, on success updates `status='sent'`, `sent_at=NOW()`, on failure updates `status='failed'`, sets `failure_reason`; returns `{ processed, succeeded, failed }`

### UI for US4

- [x] T058 [US4] Create `app/(dashboard)/scheduled/page.tsx`: fetches `/api/emails/scheduled`; renders table with columns: Recipient (from `client_snapshot`), Subject, Scheduled Time, Status badge; "Cancel" button (calls cancel route); "Reschedule" button (opens datetime picker, calls reschedule route); "Retry" button shown for `status='failed'` rows; empty state "No scheduled emails"

**Checkpoint**: Full compose → AI generate → send/schedule flow working. Cron job delivers
scheduled emails. Failed emails notify user and are retryable. US3 and US4 independently testable.

---

## Phase 5: Dashboard, Analytics & Polish (US5 — P5 + Cross-Cutting)

**Goal**: Dashboard shows accurate stats and AI summary. All pages have skeleton loading
states, toast notifications, and proper error handling. Plan upgrade prompts working.
Full quickstart.md validation passes.

**Independent Test (US5)**: With ≥1 sent email and ≥1 scheduled email, dashboard shows
correct counts, per-client activity, and a non-empty AI summary. Run `quickstart.md` Steps 16–17.

### Dashboard API & Components (US5)

- [x] T059 [US5] Create `app/api/dashboard/stats/route.ts`: single aggregating query returning `emails_sent_this_month` (COUNT where status='sent' AND sent_at in current month), `scheduled_count`, `per_client_activity` (GROUP BY client_snapshot->>'name' with last date + count), `plan_usage` (emails used + limit, clients used + limit); does NOT generate AI summary (lazy)
- [x] T060 [US5] Create `app/api/dashboard/monthly-summary/route.ts` (`POST`): builds summary prompt from stats data (total sent, top clients, most common email type); calls `generateEmail` AI layer (reuse `lib/ai/generate.ts` with a summary prompt variant); on `AIUnavailableError` returns `{ summary: null }`
- [x] T061 [P] [US5] Create `components/dashboard/StatCard.tsx`: reusable stat card with title, large number, subtitle; accepts a `Skeleton` prop for loading state
- [x] T062 [P] [US5] Create `components/dashboard/ClientActivityTable.tsx`: table showing client name, email count, last sent date; sorted by most recent; "Compose" action link per row
- [x] T063 [P] [US5] Create `components/dashboard/MonthlySummary.tsx`: fetches `/api/dashboard/monthly-summary` on mount; shows AI narrative in a card; shows skeleton while loading; shows "No summary available" when AI returns null
- [x] T064 [US5] Create `app/(dashboard)/dashboard/page.tsx`: fetches `/api/dashboard/stats`; renders four `StatCard` components (sent this month, scheduled, clients, plan usage); `ClientActivityTable`; `MonthlySummary`; "Quick Compose" button linking to `/compose`; all sections show `Skeleton` during data fetch

### UI Polish & Cross-Cutting Concerns

- [x] T065 [P] Create `components/ui/Skeleton.tsx`: animated pulse placeholder; variants for text-line, card, table-row; used across all data-loading states to satisfy the ≤300ms perceptible delay requirement
- [x] T066 [P] Create `components/ui/Toast.tsx` and `components/ui/ToastProvider.tsx`: context-based toast system; `useToast()` hook with `toast.success()`, `toast.error()`, `toast.info()`; auto-dismiss after 5 seconds; add `<ToastProvider>` to `app/layout.tsx`
- [x] T067 [P] Create `components/ui/Modal.tsx`: accessible dialog with backdrop; used for confirmation actions (delete client, disconnect Gmail, cancel scheduled email)
- [x] T068 [P] Create `components/ui/PlanBadge.tsx`: colored chip showing Free/Pro/Business plan tier; used in Navbar and client count displays
- [x] T069 Create `components/ui/UpgradePrompt.tsx`: modal shown when any API route returns HTTP 402; displays current limit, upgrade button linking to `/settings?tab=billing`; wired into a global HTTP error interceptor in `lib/api-client.ts`
- [x] T070 Create `lib/api-client.ts`: thin fetch wrapper used by all client-side API calls; intercepts 402 responses and triggers `UpgradePrompt` modal; intercepts 401 responses and redirects to login; standardises error handling
- [x] T071 [P] Add skeleton loading states to `app/(dashboard)/clients/page.tsx`, `app/(dashboard)/compose/page.tsx`, and `app/(dashboard)/scheduled/page.tsx` — wrap initial data fetches with `<Skeleton>` components while `isLoading=true`
- [x] T072 [P] Create `components/ui/GmailConnectBanner.tsx`: persistent banner shown on dashboard and compose pages when Gmail is disconnected; "Connect Gmail" CTA button; dismissed once connected
- [x] T073 [P] Create `app/api/auth/password-reset/route.ts`: calls `supabase.auth.resetPasswordForEmail(email)`; always returns 200 to prevent user enumeration
- [x] T074 Run end-to-end validation against all 17 steps in `specs/001-mailmind-ai/quickstart.md`; confirm all checklist items pass; fix any failures before marking complete

**Checkpoint**: All 5 user stories fully functional and tested. Quickstart validation passes.
App ready for beta deployment.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Auth+Gmail)**: Depends on Phase 1 completion — BLOCKS all user stories
- **Phase 3 (Clients)**: Depends on Phase 2 (needs auth middleware + Supabase tables)
- **Phase 4 (AI+Email)**: Depends on Phase 2 (needs Gmail send) + Phase 3 (needs client records)
- **Phase 5 (Dashboard+Polish)**: Depends on Phase 4 completion (needs sent email data for stats)

### User Story Dependencies

- **US1 (Phase 2)**: Can start after Phase 1 — no dependency on other stories
- **US2 (Phase 3)**: Can start after Phase 2 completes — requires auth but NOT Gmail connection
- **US3 (Phase 4)**: Can start after Phase 2 completes — requires Gmail send capability
- **US4 (Phase 4)**: Can start after T045 (send route) is done — shares AI/Gmail infrastructure
- **US5 (Phase 5)**: Requires US3+US4 data to exist for meaningful stats

### Within Each Phase

- All tasks marked [P] can run in parallel within their phase
- Sequential tasks depend on the previous task in the same group
- Cron job (T057) must have the send logic (T026 `lib/gmail/send.ts`) complete first

### Parallel Opportunities

```bash
# Phase 1 — run these in parallel (different files):
T003  types/index.ts
T004  .env.example
T008  lib/supabase/client.ts
T009  lib/supabase/server.ts
T011  lib/gmail/oauth.ts
T012  lib/plan-limits.ts

# Phase 2 — run these in parallel (different components):
T015  components/auth/SignupForm.tsx
T016  components/auth/LoginForm.tsx
T017  components/auth/GoogleSignInButton.tsx
T027  components/layout/Navbar.tsx
T028  components/layout/Sidebar.tsx

# Phase 4 — run these in parallel (different lib files):
T039  lib/pdf/extract.ts
T040  lib/ai/prompts.ts
T046  components/compose/PDFUpload.tsx
T047  components/compose/ToneSelector.tsx
T048  components/compose/TypeBadge.tsx
```

---

## Implementation Strategy

### MVP First (Phase 1 + Phase 2 only)

1. Complete Phase 1: Setup & Foundational Infrastructure
2. Complete Phase 2: Auth + Gmail Connection
3. **STOP AND VALIDATE**: User can register, connect Gmail, see empty dashboard
4. Deploy to Vercel: `vercel --prod`
5. Beta users can create accounts — no email functionality yet

### Incremental Delivery

1. Phases 1+2 → Deployed MVP (accounts + Gmail auth) ✅
2. Add Phase 3 → Clients feature live → Deploy → Demo to beta users
3. Add Phase 4 → AI email compose + send + scheduling live → Core product working
4. Add Phase 5 → Dashboard + polish → Ready for public launch

### Parallel Team Strategy

With 2–3 developers after Phase 2 completes:
- Dev A: Phase 3 (client management — 7 tasks, fast to build)
- Dev B: Phase 4 AI infrastructure (T039–T041 shared libs, then US3 routes)
- Dev C: Phase 5 UI polish (Skeleton, Toast, Modal components — all marked [P])

---

## Notes

- [P] = parallelizable; different files, no incomplete dependencies
- [US1]–[US5] = maps to user story in spec.md
- Every API route MUST call `assertPlanLimit()` before create/send operations
- Every client-side fetch MUST use `lib/api-client.ts` (for 402/401 handling)
- Gmail token MUST be encrypted/decrypted exclusively through `lib/gmail/oauth.ts`
- AI calls MUST go through `lib/ai/generate.ts` (enforces two-tier fallback)
- Commit after each task group or checkpoint
- Stop at each checkpoint to validate the story works independently
- The two-OAuth distinction (Supabase login vs Gmail send) is critical — never mix them
