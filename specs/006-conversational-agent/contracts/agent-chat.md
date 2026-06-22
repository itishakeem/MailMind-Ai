# API Contract: POST /api/agent/chat

**Route file**: `frontend/app/api/agent/chat/route.ts`  
**Method**: POST  
**Auth**: Required (Supabase session cookie)  
**Plan gate**: Pro or Business only (returns 403 for Free)

---

## Request

```typescript
interface AgentChatRequest {
  messages: ConversationMessage[];   // last ≤10 turns, oldest first
  pendingAction?: {
    action: PendingAction;           // the action proposed in the previous turn
    confirmed: boolean;              // true = user clicked Yes/Send
  } | null;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}
```

### Request Examples

**New message (no pending action)**:
```json
{
  "messages": [
    { "role": "user", "content": "Add Ahmed Khan, ahmed@xyz.com, real estate" }
  ]
}
```

**User confirms a pending action**:
```json
{
  "messages": [
    { "role": "user", "content": "Remove Sarah" },
    { "role": "assistant", "content": "Found Sarah Malik (sarah@gmail.com). Remove her?" },
    { "role": "user", "content": "Yes" }
  ],
  "pendingAction": {
    "action": {
      "type": "remove_client",
      "client": { "id": "uuid-here", "name": "Sarah Malik", "email": "sarah@gmail.com", "company": null }
    },
    "confirmed": true
  }
}
```

**User cancels a pending action**:
```json
{
  "messages": [...],
  "pendingAction": {
    "action": { "type": "remove_client", ... },
    "confirmed": false
  }
}
```

---

## Response

```typescript
type AgentResponse =
  | { type: 'text';          content: string }
  | { type: 'confirmation';  content: string; pendingAction: PendingAction }
  | { type: 'action_result'; content: string; success: boolean }
  | { type: 'clarification'; content: string; options: ClientOption[] }

interface ClientOption {
  id: string;
  name: string;
  email: string;
  company: string | null;
}
```

### Response Examples

**Plain text reply**:
```json
{ "type": "text", "content": "I can help you add clients, remove clients, or send emails. What would you like to do?" }
```

**add_client success** (no confirmation needed):
```json
{ "type": "action_result", "content": "Added Ahmed Khan (ahmed@xyz.com) to your clients. ✓", "success": true }
```

**remove_client — confirmation required**:
```json
{
  "type": "confirmation",
  "content": "Found Sarah Malik (sarah@gmail.com). Remove her from your clients?",
  "pendingAction": {
    "type": "remove_client",
    "client": { "id": "uuid", "name": "Sarah Malik", "email": "sarah@gmail.com", "company": null }
  }
}
```

**Ambiguous match — clarification needed**:
```json
{
  "type": "clarification",
  "content": "Found 2 clients named Sarah. Which one did you mean?",
  "options": [
    { "id": "uuid-1", "name": "Sarah Malik", "email": "sarah.m@gmail.com", "company": null },
    { "id": "uuid-2", "name": "Sarah Ahmed", "email": "sarah.a@company.com", "company": "Real Estate Ltd" }
  ]
}
```

**send_email — draft + confirmation**:
```json
{
  "type": "confirmation",
  "content": "Here's the draft email to Ahmed Khan. Send it?",
  "pendingAction": {
    "type": "send_email",
    "client": { "id": "uuid", "name": "Ahmed Khan", "email": "ahmed@xyz.com" },
    "draft": {
      "subject": "New 3-Bedroom Listing on Main St",
      "body": "Hi Ahmed,\n\nI wanted to let you know about a new 3-bedroom property..."
    }
  }
}
```

**Action result after confirmation**:
```json
{ "type": "action_result", "content": "Email sent to Ahmed Khan. ✓", "success": true }
```

**Cancellation acknowledged**:
```json
{ "type": "text", "content": "Got it, no email sent. Anything else I can help with?" }
```

---

## Error Responses

| Status | Body | Condition |
|---|---|---|
| 401 | `{ "error": "Unauthorized" }` | No valid session |
| 403 | `{ "error": "Agent requires a Pro or Business plan." }` | User plan is 'free' |
| 400 | `{ "error": "messages array is required" }` | Missing or malformed request body |
| 503 | `{ "error": "AI service unavailable" }` | Gemini + Nemotron both failed |
| 500 | `{ "error": "Internal server error" }` | Unexpected error |

---

## Server Processing Flow

```
POST /api/agent/chat
│
├── 1. Auth check: supabase.auth.getUser() → 401 if no session
├── 2. Plan check: users.plan → 403 if 'free'
├── 3. Validate request body → 400 if malformed
│
├── 4a. If pendingAction.confirmed === false → return cancellation text response
│
├── 4b. If pendingAction.confirmed === true
│      ├── If type === 'remove_client' → DELETE client, persist audit, return action_result
│      └── If type === 'send_email'    → sendGmail() + persist email record, return action_result
│
└── 4c. No pendingAction → call Gemini with tools + messages
         ├── Gemini returns text → return { type: 'text', content }
         └── Gemini returns tool_call:
               ├── add_client → validate + INSERT → return action_result
               ├── remove_client → fuzzy match clients
               │     ├── 0 matches → return text "no client found"
               │     ├── 1 match   → return confirmation response
               │     └── 2+ matches → return clarification response
               └── send_email → fuzzy match → generateEmail() → return confirmation with draft
```

---

## Gemini Tool Definitions

```typescript
const AGENT_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'add_client',
      description: 'Add a new client to the user\'s client list',
      parameters: {
        type: 'object',
        properties: {
          name:    { type: 'string', description: 'Full name of the client' },
          email:   { type: 'string', description: 'Email address of the client' },
          company: { type: 'string', description: 'Client\'s company, industry, or business type (optional)' }
        },
        required: ['name', 'email']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'remove_client',
      description: 'Remove an existing client by name or email reference',
      parameters: {
        type: 'object',
        properties: {
          identifier: { type: 'string', description: 'Client name or email as mentioned by the user' }
        },
        required: ['identifier']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'send_email',
      description: 'Draft and send an email to an existing client based on user instructions',
      parameters: {
        type: 'object',
        properties: {
          client_identifier: { type: 'string', description: 'Client name or email as mentioned by the user' },
          instructions:      { type: 'string', description: 'What the email should communicate, in the user\'s own words' }
        },
        required: ['client_identifier', 'instructions']
      }
    }
  }
] as const;
```

---

## System Prompt

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
- When adding a client, call the add_client function directly — no confirmation needed.
- When removing or emailing a client, always call the appropriate function — the server
  will handle the confirmation step.
```
