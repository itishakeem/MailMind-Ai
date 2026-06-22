# MailMind — Conversational Agent Feature (Build Spec)

**Status:** Ready to build
**Target:** Tonight's build session
**Built by:** Claude Code
**Feature owner:** Abdul Hakeem, Founder — TECHNOVA

---

## 1. What This Feature Is

A chat-based conversational agent embedded **inside the MailMind dashboard**, available **only to Pro-tier users**. Users talk to the agent in natural language and it performs real actions on their behalf — it is NOT a simple Q&A chatbot. It is a **tool-calling agent**.

### Core capabilities (v1 — exactly 3 tools, no more)

1. **Add a client** — user describes a client in plain language, agent extracts structured data and saves it.
2. **Remove a client** — user references a client by name/email, agent finds and deletes the matching record.
3. **Send an email** — user gives instructions ("email Ahmed about the new listing"), agent drafts the email using MailMind's existing generation engine, shows the draft, and sends via Gmail API **only after explicit user confirmation**.

### Example interactions

```
User: "Add a new client, Ahmed Khan, ahmed@xyz.com, he's in real estate"
Agent: "Got it. Added Ahmed Khan (ahmed@xyz.com) under Real Estate. ✅"

User: "Remove Sarah from my clients"
Agent: "Found Sarah Malik (sarah.m@gmail.com). Confirm removal? [Yes/No]"

User: "Email Ahmed about the new 3-bedroom listing on Main St, ask if he wants a viewing this week"
Agent: [shows generated draft]
       "Send this email to Ahmed Khan? [Yes/No]"
```

---

## 2. Non-Negotiable Rules

These rules are **mandatory** and must not be relaxed for convenience:

1. **No silent destructive actions.** `remove_client` and `send_email` must ALWAYS show a confirmation step in the chat UI before execution. The agent must never delete a client or send an email without an explicit "yes" from the user in that turn.
2. **Pro-tier gating must be enforced server-side**, not just hidden in the UI. The `/api/agent/chat` route must check the user's plan from the database on every request — a free user calling the endpoint directly (e.g. via devtools) must be rejected.
3. **Client matching must be fuzzy but confirmed.** If the user says "remove Sarah" and there are two clients named Sarah, the agent must ask which one rather than guessing.
4. **No new clients created via `send_email`.** If the agent can't find a matching client for an email request, it should say so and ask the user to add the client first — it should not auto-create one.
5. **Scope discipline.** Build only the 3 tools listed above. Do not add extra tools, extra UI panels, or speculative features in this pass.

---

## 3. Existing MailMind Stack (for context — do not change)

- **Frontend:** Next.js 14 (App Router)
- **Database:** Supabase (Postgres)
- **AI model:** Gemini 2.5 Flash, accessed via OpenRouter
- **Email sending:** Gmail API (OAuth already wired up for email generation feature)
- **Auth:** Google OAuth via Supabase Auth
- **Payments/plan tracking:** Lemon Squeezy (plan field should already exist on user/profile table)

This agent feature should **reuse existing connections** (Supabase client, Gemini/OpenRouter client, Gmail API client) rather than creating new ones. Check for existing utility files (e.g. `lib/supabase.ts`, `lib/gemini.ts`, `lib/gmail.ts`) before writing new connection logic.

---

## 4. Database Schema

> ⚠️ **Claude Code: before writing any Supabase queries, inspect the actual `clients` table schema in this project (and the `profiles`/`users` table for the plan field). Do not assume column names — confirm them first, then write queries that match exactly.**

Expected fields to look for (confirm actual names in code):
- Client identifier (id)
- Owner/user_id (foreign key to the authenticated user — critical for row-level security, a user must only see/modify their own clients)
- Name
- Email
- Category/type (e.g. real estate, marketing)
- Created timestamp

Also confirm:
- Where the user's plan (`free` / `pro` / `agency`) is stored — likely on a `profiles` or `users` table.
- Row Level Security (RLS) policies on `clients` — agent queries must respect existing RLS, not bypass it with a service role key unless that's the existing pattern for this project.

---

## 5. Agent Architecture

```
[Chat UI component in MailMind dashboard]
              │
              ▼
   POST /api/agent/chat
              │
   1. Verify session + Pro plan (server-side)
   2. Load short conversation context (last few turns)
   3. Send user message + tool definitions to Gemini 2.5 Flash
              │
              ▼
   Gemini returns either:
     a) a plain text reply, OR
     b) a tool_call (add_client / remove_client / send_email)
              │
              ▼
   If tool_call:
     - Resolve client reference against Supabase (fuzzy match by name/email)
     - If ambiguous → ask user to clarify (no execution yet)
     - If remove_client or send_email → return a CONFIRMATION payload to the UI
       (do not execute yet)
     - Only execute after the user's next message confirms ("yes")
              │
              ▼
   Execute action:
     - add_client → insert into Supabase
     - remove_client → delete from Supabase
     - send_email → call existing email generation logic → call Gmail API send
              │
              ▼
   Return confirmation/result message to chat UI
```

### Tool definitions (Gemini function calling format)

```javascript
const tools = [
  {
    name: "add_client",
    description: "Add a new client to the user's client list",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        category: { type: "string", description: "e.g. real estate, marketing, other" }
      },
      required: ["name", "email"]
    }
  },
  {
    name: "remove_client",
    description: "Remove an existing client by name or email reference",
    parameters: {
      type: "object",
      properties: {
        identifier: { type: "string", description: "client name or email as mentioned by the user" }
      },
      required: ["identifier"]
    }
  },
  {
    name: "send_email",
    description: "Draft and send an email to a specific existing client based on user instructions",
    parameters: {
      type: "object",
      properties: {
        client_identifier: { type: "string", description: "client name or email as mentioned by the user" },
        instructions: { type: "string", description: "what the email should communicate, in the user's own words" }
      },
      required: ["client_identifier", "instructions"]
    }
  }
];
```

> Adjust field names above only if they conflict with actual schema findings from Section 4.

---

## 6. Frontend Requirements — Built with OpenAI ChatKit

**Decision: use OpenAI ChatKit for the chat UI layer.** This is the "Advanced Integration" pattern — ChatKit provides the UI shell (message list, composer, widgets, confirm/cancel buttons) only. The agent's actual brain (Gemini 2.5 Flash + tool calling + Supabase + Gmail API) remains fully self-hosted on MailMind's own backend, exactly as designed in Sections 5–8. Do NOT use OpenAI Agent Builder or an OpenAI-hosted workflow — that product is being deprecated (shutdown Nov 30, 2026) and would also mean routing agent logic through OpenAI instead of Gemini.

### Install

```bash
npm install @openai/chatkit-react
```

### Integration pattern

- ChatKit needs a **client secret**, obtained from a session endpoint on MailMind's own backend (NOT calling OpenAI's hosted session API with a workflow ID — instead, this endpoint should mint a session tied to MailMind's own custom ChatKit server implementation, per the "advanced integration / custom backend" docs).
- Reference structure:

```javascript
import { ChatKit, useChatKit } from '@openai/chatkit-react';

export function MailMindAgentChat() {
  const { control } = useChatKit({
    api: {
      async getClientSecret(existing) {
        const res = await fetch('/api/agent/chatkit-session', { method: 'POST' });
        const { client_secret } = await res.json();
        return client_secret;
      },
    },
  });
  return <ChatKit control={control} className="h-[600px] w-full" />;
}
```

- The actual message handling (Gemini calls, tool execution, Supabase writes, Gmail sends) happens in MailMind's own backend, which implements the ChatKit server-side protocol (see ChatKit Python/Node SDK "custom backend" docs) — wiring this to Gemini instead of OpenAI's models is the core backend task, NOT a frontend concern.

### Use ChatKit's built-in widgets instead of custom confirm UI

- Use ChatKit's **Card** widget with `confirm`/`cancel` action buttons for `remove_client` and `send_email` confirmations — this is a native ChatKit feature, do not hand-roll a custom Yes/No component.
- Use a **Card** widget to display the generated email draft before the send confirmation.
- Widget actions are received via an `onAction` handler that forwards the payload to MailMind's backend route — wire this to the "confirm" execution step described in Section 7.

### Theming

- Use ChatKit's theming options (`options.theme`) to match MailMind's existing dark dashboard (navy/cyan/orange) — set dark mode, custom colors, and rounded corners to match. Do not leave default OpenAI styling.

### Access gating

- Component should only render for users where `plan === 'pro'` (or `'agency'`, if agency tier should also get this — confirm assumption: **default to Pro and Agency both having access, Free does not**).
- The `/api/agent/chatkit-session` endpoint must also verify Pro/Agency plan server-side before issuing a client secret — do not rely on frontend gating alone (see Section 7 enforcement rule).

---

## 7. Backend Requirements

- This backend now plays two roles: (a) a **ChatKit server** implementing the protocol ChatKit.js expects (session creation, message handling, streaming, widget actions), and (b) the **agent logic** (Gemini tool calling, Supabase, Gmail).
- New routes needed:
  - `app/api/agent/chatkit-session/route.ts` — verifies the user's session + Pro/Agency plan, then creates/returns a ChatKit session client secret tied to MailMind's custom ChatKit server (per ChatKit "advanced integration" docs — check whether the Node/JS ChatKit server SDK is mature enough, or whether the custom backend needs to be implemented in Python per the official samples; confirm current SDK language support before starting).
  - The ChatKit server's message-handling logic is where Gemini gets called with the 3 tools (Section 5).
  - A widget-action handler (for Card confirm/cancel buttons) that receives the action payload from ChatKit and triggers actual execution (Section 7 continued below).
- Steps inside the core agent logic (regardless of exact route structure):
  1. Get authenticated user from session
  2. Verify plan is Pro/Agency — return 403 if not (enforced both at `chatkit-session` creation AND again before executing any tool action — defense in depth)
  3. Parse message + conversation history (ChatKit manages thread/history state — confirm whether MailMind needs to separately persist history or can rely on ChatKit's thread management)
  4. Call Gemini with tools + system instructions (see Section 8)
  5. If a tool call comes back for `remove_client` or `send_email`, do NOT execute — render a ChatKit Card widget with the pending action details and confirm/cancel buttons
  6. On a `confirm` widget action received from the client, execute the pending action
  7. For `send_email`, reuse the existing email generation function/module already in the codebase (find it — do not duplicate prompt logic) and the existing Gmail send integration

> ⚠️ Note for Claude Code: confirm which language/runtime the ChatKit custom-backend SDK officially supports at the time of building (Python is the most documented in OpenAI's samples). If MailMind's backend is Next.js/Node-only and a mature Node ChatKit server SDK isn't available, evaluate whether a small Python microservice is needed just for the ChatKit server layer, or whether the integration can be done by implementing ChatKit's expected REST contract directly in Node without their server SDK. Flag this clearly to Abdul before committing to an approach — this is the one area of this spec with real implementation uncertainty.

---

## 8. Suggested System Prompt for the Agent

```
You are the MailMind assistant. You help users manage their clients and send emails
through natural conversation. You have access to three actions: adding a client,
removing a client, and sending an email to a client.

Rules you must follow:
- Never remove a client or send an email without the user explicitly confirming first.
- If a client reference is ambiguous (multiple matches), ask which one before proceeding.
- If no matching client is found for an email request, tell the user and suggest adding
  the client first — do not invent or create a client automatically.
- Keep responses short and conversational. Confirm actions clearly in plain language.
- If the user's request isn't related to clients or emails, respond helpfully but remind
  them of what you can do (add/remove clients, send emails).
```

---

## 9. Build Order (suggested)

1. Inspect actual Supabase schema (`clients` table + plan field location)
2. **Confirm ChatKit custom-backend SDK language support** (see warning in Section 7) before deciding final backend structure — this affects whether the agent server is pure Node or needs a small Python layer
3. Locate existing Gemini/OpenRouter client utility and existing email generation function — reuse, don't rewrite
4. Build the 3 tool handler functions (add/remove/send) as isolated, testable functions first
5. Build the ChatKit server-side message handler wiring Gemini function calling to these handlers
6. Add the pending-confirmation flow using ChatKit Card widgets (no execution without explicit confirm action)
7. Install `@openai/chatkit-react`, build the `MailMindAgentChat` component, theme it to match the dashboard, gate it to Pro/Agency plan
8. Wire frontend ChatKit session endpoint to backend
9. Test edge cases:
   - Ambiguous client name
   - No matching client
   - User cancels a confirmation (clicks Cancel on the widget)
   - Free-tier user attempting to access the session endpoint directly

---

## 10. Out of Scope for This Build

- No new tools beyond the 3 listed
- No voice input
- No multi-step automations (e.g. "email all my real estate clients") — single-client actions only for v1
- No changes to pricing tiers or billing logic
- No changes to the existing standalone email generator UI — this agent is additive, not a replacement
