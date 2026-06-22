# Quickstart: MailMind Conversational Agent (006)

**Date**: 2026-06-22  
**Branch**: `006-conversational-agent`  
**Prerequisites**: Working MailMind dev environment, Pro-plan test user

---

## New Files to Create

```
frontend/
├── app/api/agent/
│   └── chat/
│       └── route.ts           ← main agent endpoint
├── components/agent/
│   ├── AgentChatPanel.tsx     ← chat container (session state, message list, composer)
│   ├── AgentMessage.tsx       ← single message bubble
│   ├── ConfirmActionCard.tsx  ← yes/cancel card for remove + send
│   └── EmailDraftCard.tsx     ← draft display card shown before send confirmation
└── lib/agent/
    ├── tools.ts               ← AGENT_TOOLS constant + SYSTEM_PROMPT
    ├── handlers.ts            ← add_client, remove_client, send_email handler functions
    └── fuzzy.ts               ← fuzzyMatchClients() utility
```

---

## Files to Modify

| File | Change |
|---|---|
| `frontend/components/layout/DashboardShell.tsx` | Add `<AgentChatPanel>` as a floating widget (bottom-right) |
| `frontend/app/dashboard/page.tsx` (or equivalent) | Pass `user.plan` to shell so AgentChatPanel receives it |

No changes to:
- Database schema (no migrations needed)
- Supabase RLS policies
- next.config.mjs CSP headers
- Existing email generation or Gmail send utilities

---

## Environment Variables

No new environment variables required. The agent reuses:

| Variable | Already Used By |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All existing routes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All existing routes |
| `OPENROUTER_API_KEY` | `lib/ai/generate.ts` |

---

## Build Order

Follow this order — each step is independently testable before proceeding.

### Step 1 — Agent Tool Handlers (`lib/agent/`)
Build and test these pure functions first, before any UI:

1. `fuzzy.ts` — `fuzzyMatchClients(clients, identifier)` — unit-testable with mock data
2. `tools.ts` — `AGENT_TOOLS` array + `SYSTEM_PROMPT` constant
3. `handlers.ts`:
   - `handleAddClient(supabase, userId, args)` — INSERT + return result
   - `handleRemoveClient(supabase, userId, clientId)` — DELETE + return result  
   - `handleSendEmail(userId, client, draft)` — calls `sendGmail()` + INSERT email record

### Step 2 — Backend Route (`/api/agent/chat`)
Build `app/api/agent/chat/route.ts`:

1. Auth + plan gate (copy pattern from any existing route)
2. Request body validation
3. Handle `pendingAction.confirmed === true` path first (simpler — no AI call)
4. Handle `pendingAction.confirmed === false` path (cancellation text)
5. Handle the Gemini tool-calling path (new — follow `lib/ai/generate.ts` pattern)
6. Wire tool call responses to handlers

**Test without UI**: Use curl or a REST client to test all paths.

### Step 3 — Frontend Components
Build in this order (each works independently):

1. `AgentMessage.tsx` — static, pure UI
2. `EmailDraftCard.tsx` — static card with subject/body display + Send/Cancel buttons
3. `ConfirmActionCard.tsx` — static card with action description + Yes/Cancel buttons
4. `AgentChatPanel.tsx` — wires everything: session state, API calls, message list, composer

### Step 4 — Dashboard Integration
- Add `<AgentChatPanel user={user} />` to `DashboardShell.tsx` as a floating button/widget
- Panel renders only when `user.plan !== 'free'`
- Toggle open/close with a floating button (bottom-right)

### Step 5 — End-to-End Testing
Test each acceptance scenario from spec.md:

- [ ] Add client — happy path with company
- [ ] Add client — no company field
- [ ] Remove client — confirmation shown, then Yes
- [ ] Remove client — confirmation shown, then Cancel
- [ ] Remove client — ambiguous (2 clients)
- [ ] Remove client — not found
- [ ] Send email — draft shown, then Send
- [ ] Send email — draft shown, then Cancel
- [ ] Send email — client not found
- [ ] Send email — ambiguous client
- [ ] Free user — panel not visible
- [ ] Free user — direct API call returns 403
- [ ] Gmail disconnected — helpful error for send; add/remove still work

---

## Key Code References

```typescript
// Auth + plan check (every agent route handler):
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
const { data: profile } = await supabase.from('users').select('plan, gmail_token').eq('id', user.id).single();
if (profile?.plan === 'free') return NextResponse.json({ error: 'Agent requires a Pro or Business plan.' }, { status: 403 });

// Gemini tool call (follows existing pattern in lib/ai/generate.ts):
import OpenAI from 'openai';
const client = new OpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey: process.env.OPENROUTER_API_KEY! });
const response = await client.chat.completions.create({
  model: 'google/gemini-2.5-flash',
  messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
  tools: AGENT_TOOLS,
  tool_choice: 'auto',
});

// Email generation (reuse existing):
import { generateEmail } from '@/lib/ai/generate';
const draft = await generateEmail({ text: instructions, type: 'manual', tone: 'friendly', clientName: client.name });

// Gmail send (reuse existing):
import { sendGmail } from '@/lib/gmail/send';
const { messageId } = await sendGmail(user.id, client.email, draft.subject, draft.body);
```
