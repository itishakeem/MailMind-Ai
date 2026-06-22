# Implementation Plan: MailMind Conversational Agent

**Branch**: `006-conversational-agent` | **Date**: 2026-06-22 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/006-conversational-agent/spec.md`

---

## Summary

Build a Pro/Business-only conversational agent embedded in the MailMind dashboard. Users type natural language to add clients, remove clients (with confirmation), and send emails (with draft review + confirmation). The backend is a single Next.js API route that calls Gemini 2.5 Flash via the existing OpenRouter client with three tool definitions; the frontend is a custom floating chat panel built with React + Tailwind, reusing all existing MailMind utilities (email generation, Gmail send, Supabase server client, plan-limit checks).

**Key constraint resolved**: `@openai/chatkit-react` is not a real public package. All UI is built custom, consistent with the existing component patterns.

---

## Technical Context

**Language/Version**: TypeScript, Node.js (Next.js 14.2 App Router)  
**Primary Dependencies**: `openai` SDK (already installed, v4.98+), `@supabase/ssr`, `googleapis` — no new npm packages required  
**Storage**: Supabase PostgreSQL — existing `clients` and `emails` tables, existing `users` table for plan  
**Testing**: Manual E2E against dev environment; unit tests for `fuzzyMatchClients()` and handler functions  
**Target Platform**: Vercel (Next.js server, same as existing deployment)  
**Performance Goals**: Agent response within 3–5 seconds (Gemini latency); chat panel interactive within 2 seconds of load  
**Constraints**: No new database migrations; no new npm packages; RLS must be respected (use anon-key server client, not admin client); plan enforcement server-side on every request  
**Scale/Scope**: Single-user, Pro-gated; ~10–50 concurrent Pro users in beta; bounded by Gemini rate limits via OpenRouter

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Notes |
|---|---|---|---|
| I. Security & Privacy First | Agent uses user's session-scoped Supabase client (not admin); Gmail token never exposed to frontend; plan check on every request | ✅ PASS | RLS auto-enforces user isolation; no new credential exposure |
| II. AI-Augmented, Human-Confirmed | `remove_client` and `send_email` BOTH require an explicit confirmation step before execution; agent NEVER acts autonomously on destructive actions | ✅ PASS | Core invariant of this feature |
| III. Simplicity-Driven UX | Chat panel is a floating widget; natural language input; skeleton state during AI calls; no jargon exposed | ✅ PASS | Custom UI with Tailwind follows existing design language |
| IV. Graceful Degradation & Resilience | `generateEmail()` already implements Gemini → Nemotron fallback; Gmail disconnection detected and surfaced to user; agent route returns 503 if both AI providers fail | ✅ PASS | Inherited from existing utilities |
| V. Cost-Conscious Scalability | No new infrastructure costs; reuses existing OpenRouter subscription; gated to Pro plan (paid users) — agent calls funded by Pro revenue | ✅ PASS | Token cost per interaction: ~1–3K tokens/request, well within budget |
| VI. Data Ownership & Auditability | `send_email` handler persists email record to `emails` table (same as existing `/api/emails/send`); client deletions are user-initiated and confirmed | ✅ PASS | Audit trail maintained |

**Post-design re-check**: All six principles maintained. No violations requiring justification.

---

## Project Structure

### Documentation (this feature)

```
specs/006-conversational-agent/
├── spec.md              ← feature specification
├── plan.md              ← this file
├── research.md          ← Phase 0 — all unknowns resolved
├── data-model.md        ← Phase 1 — entities and runtime types
├── quickstart.md        ← Phase 1 — build guide
├── contracts/
│   └── agent-chat.md   ← Phase 1 — POST /api/agent/chat contract
├── checklists/
│   └── requirements.md ← spec quality checklist (all pass)
└── tasks.md             ← Phase 2 output (/sp.tasks — NOT created by /sp.plan)
```

### Source Code (repository root)

```
frontend/
├── app/
│   └── api/
│       └── agent/
│           └── chat/
│               └── route.ts          [NEW] main agent API route
│
├── components/
│   └── agent/
│       ├── AgentChatPanel.tsx        [NEW] chat container + session state
│       ├── AgentMessage.tsx          [NEW] message bubble component
│       ├── ConfirmActionCard.tsx     [NEW] yes/cancel confirmation card
│       └── EmailDraftCard.tsx        [NEW] email draft display + send/cancel
│
├── lib/
│   └── agent/
│       ├── tools.ts                  [NEW] AGENT_TOOLS + SYSTEM_PROMPT
│       ├── handlers.ts               [NEW] add/remove/send handler functions
│       └── fuzzy.ts                  [NEW] fuzzyMatchClients() utility
│
└── components/
    └── layout/
        └── DashboardShell.tsx        [MODIFY] add floating AgentChatPanel widget

No backend/ or supabase/migrations/ changes needed.
```

**Structure Decision**: Single web project (Option 2 from template) — `frontend/` only. No new backend service needed; the agent route is a standard Next.js API route handler. No database migrations required.

---

## Phase 0: Research Results

All unknowns resolved. See [`research.md`](research.md) for full details. Summary:

| Unknown | Resolution |
|---|---|
| Clients table `category` field | Does not exist. Use `company` field instead. |
| Plan tiers for access | 'pro' and 'business' (not 'agency') |
| `@openai/chatkit-react` availability | Not a real public package. Build custom chat UI with React + Tailwind. |
| Agent backend architecture | Single Next.js route + OpenAI SDK (OpenRouter) tool calling — same pattern as `lib/ai/generate.ts` |
| Conversation history storage | Client-side only (React state); last 10 turns sent per request; no DB persistence in v1 |
| Supabase client to use | Server client (anon key + session cookie) — NOT admin client — so RLS applies |
| CSP impact | None. Agent calls MailMind's own endpoints only. |
| Fuzzy match strategy | Case-insensitive substring match on name + email; 0/1/2+ results map to error/confirm/clarify |

---

## Phase 1: Design Artifacts

### Data Model

See [`data-model.md`](data-model.md) for full entity definitions.

**Existing tables used (unchanged)**:
- `public.clients` — add_client writes; remove_client deletes; fuzzy match reads
- `public.users` — plan + gmail_token read for access gate
- `public.emails` — send_email writes (audit trail)

**New runtime-only types** (TypeScript interfaces, no DB):
- `ConversationMessage` — session-scoped message history
- `PendingAction` — typed union for remove_client / send_email pending state
- `AgentResponse` — typed union response envelope: text / confirmation / action_result / clarification

### API Contract

See [`contracts/agent-chat.md`](contracts/agent-chat.md) for full request/response specs, error codes, processing flow diagram, tool definitions, and system prompt.

**Single endpoint**: `POST /api/agent/chat`

**Response types**:
- `text` — plain assistant message (out-of-scope queries, confirmations of non-destructive actions)
- `confirmation` — pending action that requires user approval (remove, send)
- `action_result` — result of a completed action (success or handled failure)
- `clarification` — multiple client matches found; user must pick one

### Reusable Functions (no changes to these files)

| Function | File | How Agent Uses It |
|---|---|---|
| `generateEmail(params)` | `lib/ai/generate.ts` | Drafts email body + subject in `send_email` handler |
| `sendGmail(userId, to, subject, body)` | `lib/gmail/send.ts` | Sends email after user confirmation |
| `assertPlanLimit(supabase, userId, 'client_create')` | `lib/plan-limits.ts` | Called in add_client handler to enforce Pro client limits |
| `createClient()` (server) | `lib/supabase/server.ts` | Auth + Supabase access in agent route |

### Frontend Design Decisions

**Chat panel placement**: Floating widget, bottom-right corner of dashboard. Toggle button shows/hides the panel. This is additive — zero disruption to existing dashboard layout.

**Confirmation UX**:
- `remove_client` → `ConfirmActionCard` showing client name + email + "Remove?" with Yes / Cancel buttons
- `send_email` → `EmailDraftCard` showing To, Subject, Body preview + "Send Email" / "Cancel" buttons

**State shape** (AgentChatPanel internal state):
```typescript
const [messages, setMessages] = useState<ConversationMessage[]>([]);
const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [isOpen, setIsOpen] = useState(false);
```

**Plan gate**: `AgentChatPanel` accepts `user: User` prop; renders nothing if `user.plan === 'free'`. Server route also enforces independently.

---

## Complexity Tracking

No Constitution Check violations. No complexity justification required.

---

## Build Order Summary

Refer to [`quickstart.md`](quickstart.md) for detailed step-by-step instructions.

1. **Lib layer** — `lib/agent/fuzzy.ts`, `tools.ts`, `handlers.ts` (pure functions, testable without UI)
2. **API route** — `app/api/agent/chat/route.ts` (testable with curl before UI exists)
3. **UI components** — `AgentMessage`, `EmailDraftCard`, `ConfirmActionCard`, `AgentChatPanel` (in that order)
4. **Integration** — Wire panel into `DashboardShell.tsx`
5. **E2E test** — All 13 acceptance scenarios from spec.md

---

## Risks & Follow-ups

1. **Gemini tool calling reliability**: Gemini's function calling via OpenRouter may occasionally return malformed tool arguments. The handler layer must validate all tool arguments before executing (already planned in `handlers.ts`). If Gemini returns a text response instead of a tool call for an action request, the agent should gracefully ask the user to rephrase.

2. **Email audit trail**: The agent's `send_email` handler must persist the email record to the `emails` table — not just call `sendGmail()`. This is essential for Constitution §VI (auditability). Verify the email insert schema matches what the existing `/api/emails/send` route uses before writing the handler.

3. **Conversation history size**: Passing unbounded history in each request could make prompts expensive. Cap at 10 turns client-side to bound token cost.

---

📋 **Architectural decision detected: Custom chat UI vs. @openai/chatkit-react**  
The build spec proposed ChatKit but it is not a real public package. Decided to build custom React + Tailwind chat panel. Document reasoning and tradeoffs? Run `/sp.adr chatkit-vs-custom-ui`
