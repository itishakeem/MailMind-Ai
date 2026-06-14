# Implementation Plan: MailMind AI — Full Product

**Branch**: `001-mailmind-ai` | **Date**: 2026-06-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-mailmind-ai/spec.md`

## Summary

MailMind AI is a full-stack web SaaS that lets freelancers and small businesses send
professional emails to clients from their own Gmail, with AI handling email generation
from PDF uploads or free-text descriptions. The technical approach uses Next.js 14 App
Router as the unified frontend + API layer, Supabase for auth and data persistence, the
Gmail API for sending, and a two-tier AI pipeline (Gemini Flash → Nemotron fallback).
Scheduled delivery runs via Vercel Cron Jobs hitting a protected internal API route.

## Technical Context

**Language/Version**: TypeScript 5 / Node.js 20 (Next.js 14 minimum)
**Primary Dependencies**: Next.js 14 (App Router), Tailwind CSS, Supabase JS v2,
  Google Gmail API (googleapis npm), OpenRouter SDK (Gemini Flash), NVIDIA NIM API
  (Nemotron 3 Super), pdf-parse npm
**Storage**: Supabase PostgreSQL (hosted); Row Level Security enforces per-user isolation
**Testing**: Jest + React Testing Library (components), Vitest (API/service unit tests)
**Target Platform**: Web browser (desktop-first, mobile-responsive); Vercel serverless
**Project Type**: Web application — unified Next.js fullstack (App Router + Route Handlers)
**Performance Goals**: AI generation <10 s; Gmail send confirmation <5 s; page load
  skeleton within 300 ms; scheduled delivery within 5 min of target time
**Constraints**: Free Vercel + Supabase tiers during beta; total infra cost <$157/month
  at 1,000 users; Gmail send-only OAuth scope (no read/delete)
**Scale/Scope**: Target 1,000 users × 30 emails/month = 30,000 emails/month at scale;
  beta launch: 10 users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Gate | Status |
|---|---|---|
| I. Security & Privacy First | OAuth tokens encrypted at rest; JWT short-lived; send-only scope | ✅ PASS — Supabase encrypted storage; PKCE OAuth flow |
| II. AI-Augmented, Human-Confirmed | No email sent without explicit user action (Send Now or user-set schedule) | ✅ PASS — Preview step mandatory before send/schedule actions |
| III. Simplicity-Driven UX | Every core task one click; skeleton states for >300 ms ops | ✅ PASS — Compose flow designed as single-page wizard |
| IV. Graceful Degradation | Gemini Flash → Nemotron fallback; manual compose if both fail | ✅ PASS — AI layer wraps both providers; fallback chain coded in lib/ai/ |
| V. Cost-Conscious Scalability | Free tier stack; AI cost estimated before dispatch | ✅ PASS — Nemotron free for beta; Gemini Flash at $0.10/1M tokens |
| VI. Data Ownership & Auditability | Full email audit trail; text-only document storage | ✅ PASS — emails table with status/timestamps; no PDF blobs stored |

No violations. Complexity Tracking section not required.

## Project Structure

### Documentation (this feature)

```text
specs/001-mailmind-ai/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/           ← Phase 1 output
│   ├── auth.yaml
│   ├── gmail.yaml
│   ├── clients.yaml
│   ├── emails.yaml
│   ├── ai.yaml
│   └── dashboard.yaml
└── tasks.md             ← Phase 2 output (/sp.tasks command)
```

### Source Code (repository root)

```text
app/
├── (auth)/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── layout.tsx
├── (dashboard)/
│   ├── dashboard/page.tsx
│   ├── clients/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── compose/page.tsx
│   ├── scheduled/page.tsx
│   ├── settings/page.tsx
│   └── layout.tsx
├── api/
│   ├── auth/callback/route.ts
│   ├── gmail/
│   │   ├── connect/route.ts
│   │   ├── callback/route.ts
│   │   └── disconnect/route.ts
│   ├── clients/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── emails/
│   │   ├── send/route.ts
│   │   ├── schedule/route.ts
│   │   └── [id]/
│   │       ├── reschedule/route.ts
│   │       ├── cancel/route.ts
│   │       └── retry/route.ts
│   ├── documents/upload/route.ts
│   ├── ai/generate/route.ts
│   ├── dashboard/stats/route.ts
│   └── cron/send-scheduled/route.ts
├── layout.tsx
└── page.tsx

components/
├── ui/                  # Button, Input, Badge, Skeleton, Modal, Toast
├── auth/                # LoginForm, SignupForm, GoogleSignInButton
├── clients/             # ClientList, ClientCard, ClientForm, ClientHistory
├── compose/             # ComposeWizard, PDFUpload, AIPreview, ToneSelector
├── dashboard/           # StatCard, ClientActivityTable, MonthlySummary
└── layout/              # Navbar, Sidebar, PlanBadge

lib/
├── supabase/
│   ├── client.ts        # Browser Supabase client (singleton)
│   └── server.ts        # Server Supabase client (per-request)
├── gmail/
│   ├── oauth.ts         # PKCE OAuth flow; token encrypt/decrypt
│   └── send.ts          # Gmail API send; token refresh
├── ai/
│   ├── generate.ts      # Primary (Gemini Flash) → fallback (Nemotron) chain
│   ├── detect-type.ts   # Context type classification
│   └── prompts.ts       # System prompt templates per type + tone
├── pdf/
│   └── extract.ts       # pdf-parse wrapper; extraction error handling
└── plan-limits.ts       # Free/Pro/Business limit enforcement

types/
└── index.ts             # Shared TypeScript interfaces

vercel.json              # Cron job schedule definition
.env.example             # All required env vars documented
```

**Structure Decision**: Unified Next.js 14 App Router (Option 2 variant — single repo,
frontend pages in `app/(dashboard)/`, backend logic in `app/api/` Route Handlers, shared
business logic in `lib/`). A separate backend service would add deployment complexity and
cost without benefit at this scale. Supabase eliminates the need for a standalone auth
service.
