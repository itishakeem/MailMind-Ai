# MailMind — Alex AI Agent (Build Spec)

**Status:** Built and deployed
**Feature owner:** Abdul Hakeem, Founder — TECHNOVA
**Agent name:** Alex

---

## 1. What This Feature Is

A chat-based conversational agent embedded **inside the MailMind dashboard** as a floating chat panel. Users talk to Alex in natural language — in **any language** — and it performs real actions on their behalf. It is a **tool-calling agent**, not a Q&A chatbot.

### Access by plan

| Plan | Access | Limit |
|---|---|---|
| Free | ✅ Yes | 10 messages per 24 hours |
| Pro | ✅ Yes | Unlimited |
| Business | ✅ Yes | Unlimited |

Plan gating is enforced **server-side** on every request — a free user who exhausts their daily limit, or an unauthenticated request, is rejected at the API route.

### Agent tools (v1 — exactly 6)

1. **`list_clients`** — retrieves the user's full client list
2. **`add_client`** — extracts structured data from natural language and inserts a new client
3. **`update_client`** — updates name, email, company, or phone for an existing client
4. **`remove_client`** — removes a client after explicit confirmation
5. **`send_email`** — drafts an email using the existing AI generation engine, shows the draft for approval, then sends via Gmail API
6. **`generate_report`** — generates a downloadable PDF activity report (24h, 7d, or 30d)

### Example interactions

```
User: "Add a new client, Ahmed Khan, ahmed@xyz.com, real estate company"
Alex: "Got it. Added Ahmed Khan (ahmed@xyz.com) — Real Estate Company. ✅"

User: "Update Ahmed's phone to +923001234567"
Alex: [shows UpdateClientCard confirmation]
      "Update Ahmed Khan's phone number? [Confirm / Cancel]"

User: "Remove Sarah from my clients"
Alex: "Found Sarah Malik (sarah.m@gmail.com). Remove her permanently? [Confirm / Cancel]"

User: "Email Ahmed about the new 3-bedroom listing on Main St"
Alex: [shows EmailDraftCard with subject + body]
      "Here's the draft for Ahmed Khan. Ready to send? [Send / Cancel]"

User: "Give me a 7-day report"
Alex: "Here's your activity report for the last 7 days." [PDF download card]
```

---

## 2. Non-Negotiable Rules

1. **No silent destructive actions.** `remove_client` and `send_email` always show a confirmation card in the chat UI before execution. The agent never deletes a client or sends an email without an explicit "Confirm" from the user.
2. **Plan enforcement is server-side.** The `/api/agent/chat` route checks the user's plan from the `users` table on every request. Free users over the daily limit receive a clear message. Unauthenticated requests return 401.
3. **Rate limiting for free users.** Free users are limited to `FREE_DAILY_LIMIT = 10` messages per 24-hour rolling window, tracked in the `agent_message_logs` table. Rate-limit checks run before the AI call so they don't consume tokens.
4. **Client matching is fuzzy but confirmed.** If the user says "remove Sarah" and there are multiple Sarahs, the agent asks which one (`clarification` response type). It never guesses.
5. **No new clients via `send_email`.** If no matching client is found for an email request, the agent says so and asks the user to add the client first — it does not auto-create one.
6. **Scope discipline.** Build only the 6 tools listed. No extra tools, no speculative features.

---

## 3. Stack (existing — do not change)

- **Frontend:** Next.js 14 (App Router)
- **Database:** Supabase (Postgres) — `supabase/server` client
- **AI (Pro/Business):** `google/gemini-2.5-flash` via OpenRouter (`OPENROUTER_API_KEY`)
- **AI (Free):** `openrouter/auto` via OpenRouter (`OPENROUTER_API_KEY_FREE`)
- **Email sending:** Gmail API (OAuth already wired up)
- **Auth:** Supabase Auth
- **Payments/plan tracking:** Lemon Squeezy — plan field is `plan` on the `users` table, values: `free` / `pro` / `business`

All connections are reused from existing utilities — `lib/supabase/server.ts`, `lib/ai/generate.ts`, `lib/gmail/send.ts`.

---

## 4. Database Schema (confirmed)

### `users` table (relevant fields)
```
id            uuid  PK
name          text
plan          text  — values: "free" | "pro" | "business"
gmail_token   text  — null if Gmail not connected
```

### `clients` table
```
id       uuid  PK
user_id  uuid  FK → users.id  (RLS enforced)
name     text
email    text
company  text  nullable
phone    text  nullable
address  text  nullable
```

> Note: there is no `category` field. Use `company` for industry/sector info.

### `agent_message_logs` table (rate limiting)
```
id          uuid  PK
user_id     uuid  FK → users.id
created_at  timestamptz  default now()
```

Only rows for `free` plan users are written. Query counts rows in the last 24h to enforce the limit.

---

## 5. Agent Architecture

```
[AgentChatPanel — floating chat UI in dashboard]
              │
              ▼
   POST /api/agent/chat
              │
   1. Verify Supabase session → 401 if missing
   2. Load user profile (plan, name, gmail_token) from users table
   3. If body.pendingAction → resolve confirmed action immediately (no AI call)
   4. If plan === "free" → count agent_message_logs in last 24h
      → if count >= 10: return rate-limit message
   5. Build system prompt (includes user name, plan, total client count)
   6. Call OpenRouter (model depends on plan) with AGENT_TOOLS + conversation history
              │
              ▼
   OpenRouter returns either:
     a) plain text reply  → { type: "text", content }
     b) tool_call         → execute tool handler
              │
              ▼
   Tool execution:
     list_clients    → SELECT from clients WHERE user_id = $1
     add_client      → INSERT into clients
     update_client   → fuzzy match → confirmation payload (no execute yet)
     remove_client   → fuzzy match → confirmation payload (no execute yet)
     send_email      → fuzzy match → generateEmail() → confirmation payload with draft
     generate_report → handleGenerateReport() → PDF base64
              │
              ▼
   Response types:
     { type: "text" }          — plain message
     { type: "confirmation" }  — shows confirm/cancel card; pendingAction stored in UI state
     { type: "clarification" } — shows numbered list of matching clients
     { type: "report" }        — text + { pdf: { base64, filename } }
     { type: "action_result" } — result after confirmed execution
```

### Tool definitions (OpenAI-compatible format for OpenRouter)

```typescript
const AGENT_TOOLS = [
  {
    type: "function",
    function: {
      name: "list_clients",
      description: "Retrieve the user's full client list with names, emails, companies, and phone numbers",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "add_client",
      description: "Add a new client to the user's client list",
      parameters: {
        type: "object",
        properties: {
          name:    { type: "string" },
          email:   { type: "string" },
          company: { type: "string", description: "Client's company or industry (optional)" },
          phone:   { type: "string", description: "Client's phone number (optional)" },
        },
        required: ["name", "email"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_client",
      description: "Update an existing client's information — name, email, company, or phone",
      parameters: {
        type: "object",
        properties: {
          identifier: { type: "string", description: "Client's current name or email" },
          name:       { type: "string" },
          email:      { type: "string" },
          company:    { type: "string" },
          phone:      { type: "string" },
        },
        required: ["identifier"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_client",
      description: "Remove an existing client from the user's list (requires confirmation)",
      parameters: {
        type: "object",
        properties: {
          identifier: { type: "string", description: "Client name or email as mentioned by the user" },
        },
        required: ["identifier"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_email",
      description: "Draft and send an email to a client based on user instructions (shows draft for approval)",
      parameters: {
        type: "object",
        properties: {
          client_identifier: { type: "string", description: "Client name or email as mentioned by the user" },
          instructions:      { type: "string", description: "What the email should say, in the user's own words" },
        },
        required: ["client_identifier", "instructions"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_report",
      description: "Generate a PDF activity report showing emails sent and clients added over a time period",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            enum: ["24h", "7d", "30d"],
            description: "Time period: 24h, 7d, or 30d",
          },
        },
        required: ["period"],
      },
    },
  },
];
```

---

## 6. Frontend — Custom Chat UI

**Implementation:** Custom React components, no third-party chat SDK.

### Component tree

```
AgentChatPanel          — floating panel, manages all state
  AgentMessage          — renders individual user/assistant messages (markdown)
  ConfirmActionCard     — confirm/cancel for remove_client
  EmailDraftCard        — shows draft subject + body, confirm/cancel for send_email
  UpdateClientCard      — shows pending field changes, confirm/cancel for update_client
```

### Key behaviours

- **Floating button** in bottom-right corner opens the panel
- **Full-screen on mobile**, fixed 390×600px box on sm+ screens
- **Chat history** persisted in `localStorage` under `mailmind_chat_sessions` (up to 15 sessions, each storing up to 10 messages for context)
- **Session panel** (history drawer) lets users switch between past conversations
- **Free tier counter** shows `{used}/{10}` remaining messages in the header
- **Input disabled** when daily limit is reached; placeholder says "Daily limit reached — resets in 24 hrs"
- **Multilingual**: Alex responds in whatever language the user writes in

### Access gating

- Component renders for all users (free, pro, business)
- Free users see the usage counter; pro/business see their plan badge
- Server enforces the rate limit regardless of UI state

### Theming

Matches the dark dashboard using CSS custom properties (`--a-from`, `--a-to`, `--a-glow`, `--a-text`, `--a-bg`, `--a-bd`, `--a-gradient`).

---

## 7. Backend — Route: `POST /api/agent/chat`

### File: `app/api/agent/chat/route.ts`

**Request body:**
```typescript
interface AgentChatRequest {
  messages: { role: "user" | "assistant"; content: string }[];
  pendingAction: { action: PendingAction; confirmed: boolean } | null;
}
```

**Response types:**
```typescript
type AgentResponse =
  | { type: "text";          content: string }
  | { type: "action_result"; content: string }
  | { type: "confirmation";  content: string; pendingAction: PendingAction }
  | { type: "clarification"; content: string; options: ClientMatch[] }
  | { type: "report";        content: string; pdf: { base64: string; filename: string } }
```

**Execution order:**
1. Auth check (Supabase session)
2. Load `users` row → `plan`, `name`, `gmail_token`
3. If `pendingAction` in body → resolve it directly (no AI call, no rate-limit charge)
4. If `plan === "free"` → count `agent_message_logs` in last 24h; return limit message if ≥ 10
5. Count user's clients (for system prompt context)
6. Call OpenRouter with `google/gemini-2.5-flash` (pro/business) or `openrouter/auto` (free)
7. Log to `agent_message_logs` after successful AI call (free only)
8. Handle tool call or return plain text

### Helper modules

| File | Purpose |
|---|---|
| `lib/agent/tools.ts` | `AGENT_TOOLS` array + `buildSystemPrompt()` |
| `lib/agent/handlers.ts` | `handleAddClient`, `handleUpdateClient`, `handleRemoveClient`, `handleSendEmail`, `handleGenerateReport` |
| `lib/agent/fuzzy.ts` | `fuzzyMatchClients()` — matches by name/email substring |
| `lib/agent/types.ts` | Shared TypeScript types |
| `lib/agent/report.ts` | PDF report generation logic |
| `lib/ai/generate.ts` | Existing `generateEmail()` — reused by `send_email` tool |

---

## 8. System Prompt

```
You are Alex, a smart and friendly AI assistant built into MailMind. You help {name}
manage their freelance clients and email communications.

About {name}:
- Plan: {Free | Pro | Business}
- Current clients: {count}

What you can do:
1. List the user's current clients
2. Add a new client (name + email required; company and phone optional)
3. Update an existing client's info (name, email, company, or phone)
4. Remove a client (always confirm first — this is permanent)
5. Send an email to a client (draft shown for approval before sending)
6. Generate a PDF report of activity (24h, 7-day, or 30-day)

How to behave:
- Respond in whatever language the user writes in.
- Be warm, direct, and human. Short sentences. No corporate speak.
- For destructive actions (remove, send email) — the server asks for confirmation.
  You do NOT need to double-ask.
- For add and update — call the tool directly without asking permission first.
- If a client name is ambiguous, ask which one before proceeding.
- If the user asks something outside your scope, kindly redirect.
- Always confirm what you did in a friendly, brief sentence after completing an action.
```

---

## 9. Out of Scope for v1

- No voice input
- No multi-client bulk actions (e.g. "email all real estate clients") — single-client only
- No new pricing tier changes
- No changes to the existing standalone email composer UI — Alex is additive
- No team/shared agent sessions (Business team feature is a future item)
