# Tasks: MailMind Conversational Agent

**Input**: Design documents from `/specs/006-conversational-agent/`  
**Branch**: `006-conversational-agent`  
**Prerequisites**: plan.md âœ“, spec.md âœ“, research.md âœ“, data-model.md âœ“, contracts/agent-chat.md âœ“, quickstart.md âœ“

**Tests**: No TDD requested. Manual acceptance testing included as validation tasks per user story.

**Organization**: 6 phases â€” Setup â†’ Foundational (US4) â†’ US1 â†’ US2 â†’ US3 â†’ Polish.  
Each story phase is independently testable before moving to the next.

---

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Parallelizable â€” different files, no dependency on incomplete siblings
- **[Story]**: Which user story this task serves (US1 = add client, US2 = remove, US3 = send email, US4 = access gating)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory skeleton and define all shared TypeScript types and constants.  
No business logic yet â€” just structure and contracts.

- [x] T001 Create directory structure: `frontend/app/api/agent/chat/`, `frontend/components/agent/`, `frontend/lib/agent/` (create each via placeholder file if needed)
- [x] T002 [P] Implement `frontend/lib/agent/fuzzy.ts` â€” export `fuzzyMatchClients(clients: {id:string;name:string;email:string;company:string|null}[], identifier: string)` returning all clients whose name or email contains the identifier (case-insensitive substring match)
- [x] T003 [P] Implement `frontend/lib/agent/tools.ts` â€” export `AGENT_TOOLS` (OpenAI-format tool array with `add_client`, `remove_client`, `send_email` definitions matching contracts/agent-chat.md) and `SYSTEM_PROMPT` string (verbatim from contracts/agent-chat.md System Prompt section)
- [x] T004 [P] Create `frontend/lib/agent/types.ts` â€” export `ConversationMessage`, `PendingRemoveClient`, `PendingSendEmail`, `PendingAction` (union), `AgentTextResponse`, `AgentConfirmationResponse`, `AgentActionResultResponse`, `AgentClarificationResponse`, `AgentResponse` (union), `AgentChatRequest` interfaces exactly matching contracts/agent-chat.md

---

## Phase 2: Foundational â€” Auth Gate + Gemini Core (US4, cross-cutting)

**Purpose**: Implement the plan-gating invariant (US4) and the core Gemini tool-calling loop â€” both block all user story implementation.

**âš ï¸ CRITICAL**: No user story can be correctly built or tested until this phase is complete.

- [x] T005 Create `frontend/app/api/agent/chat/route.ts` â€” POST handler skeleton: (1) `createClient()` from `lib/supabase/server`, (2) `supabase.auth.getUser()` â†’ return 401 if no session, (3) query `users` table for `plan` and `gmail_token` â†’ return 403 `{"error":"Agent requires a Pro or Business plan."}` if plan is `'free'`, (4) parse and validate request body (`messages` array required) â†’ return 400 if missing, (5) handle `pendingAction.confirmed === false` path â†’ return `{type:'text', content:'Got it, cancelled. Anything else I can help with?'}`
- [x] T006 Add Gemini tool-calling core to `frontend/app/api/agent/chat/route.ts` â€” after plan gate: (1) initialize `new OpenAI({baseURL:'https://openrouter.ai/api/v1', apiKey: process.env.OPENROUTER_API_KEY!})` (same pattern as `lib/ai/generate.ts`), (2) call `chat.completions.create({model:'google/gemini-2.5-flash', messages:[{role:'system',content:SYSTEM_PROMPT},...messages], tools:AGENT_TOOLS, tool_choice:'auto'})`, (3) if response has `content` (text) â†’ return `{type:'text', content}`, (4) if API throws â†’ return 503 `{error:'AI service unavailable'}`; leave `tool_calls` handling as `// TODO: wire handlers` stub
- [x] T007 [P] Create `frontend/components/agent/AgentMessage.tsx` â€” pure presentational component: accepts `role: 'user'|'assistant'`, `content: string`; user messages right-aligned with accent background; assistant messages left-aligned with neutral background; no state, no side effects; import and use Lucide icons (`User`, `Bot`) for avatars
- [x] T008 Create `frontend/components/agent/AgentChatPanel.tsx` â€” skeleton with: state `messages: ConversationMessage[]`, `pendingAction: PendingAction|null`, `isLoading: boolean`, `isOpen: boolean`; prop `user: User`; render `null` if `user.plan === 'free'`; render message list using `<AgentMessage>` for each message; text `<input>` with submit button; `async function sendMessage(text: string)` that POSTs to `/api/agent/chat` with `{messages, pendingAction}`, appends response content to messages, clears pendingAction on action_result; import types from `lib/agent/types.ts`

**Checkpoint US4**: After T005 completes, verify with curl:  
`curl -X POST /api/agent/chat -H "Cookie: <free-user-session>" -d '{"messages":[{"role":"user","content":"test"}]}'` â†’ expect 403.  
Pro/Business session â†’ expect non-403 response (AI call may fail in dev if no API key, that's OK).

---

## Phase 3: User Story 1 â€” Add Client via Conversation (Priority: P1) ðŸŽ¯ MVP

**Goal**: Pro user types client details in chat; agent extracts, saves to Supabase, confirms. No confirmation step needed â€” add is non-destructive.

**Independent Test**: `curl POST /api/agent/chat` with `{"messages":[{"role":"user","content":"Add Ahmed Khan, ahmed@xyz.com, real estate"}]}` as Pro user â†’ response `{type:'action_result', success:true, content:'Added Ahmed Khan...'}` AND client record exists in Supabase `clients` table for that user.

- [x] T009 [US1] Implement `handleAddClient` in `frontend/lib/agent/handlers.ts` â€” signature: `handleAddClient(supabase: SupabaseClient, userId: string, args: {name:string; email:string; company?:string}): Promise<AgentActionResultResponse>`; validate name non-empty (â‰¤200 chars) and email format; call `assertPlanLimit(supabase, userId, 'client_create')` from `lib/plan-limits.ts`; INSERT `{user_id:userId, name, email, company:company??null}` into `clients` table; return `{type:'action_result', content:'Added [name] ([email]) to your clients. âœ“', success:true}` on success; return `{type:'action_result', content:'[human-readable error]', success:false}` on any failure
- [x] T010 [US1] Wire `add_client` tool call in `frontend/app/api/agent/chat/route.ts` â€” in the tool_calls block: when `tool_call.function.name === 'add_client'`, parse `JSON.parse(tool_call.function.arguments)`, fetch current user's clients from Supabase for plan-limit context, call `handleAddClient(supabase, user.id, args)`, return the handler's `AgentActionResultResponse` directly to the client
- [ ] T011 [US1] Manual acceptance test for US1 â€” verify all three acceptance scenarios from spec.md: (a) add with name+email+company â†’ success message + client in DB; (b) add with name+email only (no company) â†’ success with null company; (c) Free user direct call â†’ 403; confirm `user_id` on new record matches authenticated user's id (RLS test)

**Checkpoint US1**: US1 is complete when T011 passes all three scenarios. The add-client flow is fully functional end-to-end.

---

## Phase 4: User Story 2 â€” Remove Client via Conversation (Priority: P2)

**Goal**: Pro user references a client by name/email; agent fuzzy-matches, returns a confirmation card; client is deleted only after explicit "Yes". Ambiguous matches ask user to pick. Not-found references inform the user gracefully.

**Independent Test**: Type "Remove Sarah" in UI (or via curl), verify confirmation card/response appears with client details. Click Yes â†’ client gone from DB. Repeat with ambiguous name â†’ clarification response. Repeat with unknown name â†’ "not found" text response.

- [x] T012 [P] [US2] Implement `handleRemoveClient` in `frontend/lib/agent/handlers.ts` â€” signature: `handleRemoveClient(supabase: SupabaseClient, userId: string, clientId: string): Promise<AgentActionResultResponse>`; DELETE from `clients` where `id = clientId AND user_id = userId` (double-scope for safety); return `{type:'action_result', content:'[name] has been removed from your clients. âœ“', success:true}`; on error return `{type:'action_result', content:'Could not remove client â€” please try again.', success:false}`
- [x] T013 [P] [US2] Wire `remove_client` tool call in `frontend/app/api/agent/chat/route.ts` â€” when `tool_call.function.name === 'remove_client'`: (1) parse identifier arg, (2) fetch all user clients `supabase.from('clients').select('id,name,email,company').eq('user_id',user.id)`, (3) call `fuzzyMatchClients(clients, identifier)`, (4) 0 matches â†’ return `{type:'text', content:'I couldn\'t find a client matching "[identifier]". Try checking the client name or email.'}`, (5) 2+ matches â†’ return `{type:'clarification', content:'Found [N] clients matching "[identifier]". Which one did you mean?', options:[...clients]}`, (6) 1 match â†’ return `{type:'confirmation', content:'Found [name] ([email]). Remove them from your clients?', pendingAction:{type:'remove_client', client:{id,name,email,company}}}`
- [x] T014 [US2] Handle confirmed `remove_client` pending action in `frontend/app/api/agent/chat/route.ts` â€” in the `pendingAction.confirmed === true` block: when `pendingAction.action.type === 'remove_client'`, extract `clientId = pendingAction.action.client.id`, call `handleRemoveClient(supabase, user.id, clientId)`, return the handler result; the `confirmed === false` path already returns cancellation text from T005
- [x] T015 [P] [US2] Create `frontend/components/agent/ConfirmActionCard.tsx` â€” props: `title: string`, `description: string`, `details: {label:string;value:string}[]`, `onConfirm: (confirmed: boolean) => void`, `isLoading: boolean`; renders a card with title, details list (e.g. Name: Sarah Malik, Email: sarah@gmail.com), "Yes, Remove" primary button and "Cancel" secondary button; buttons disabled while `isLoading`; styled with Tailwind to match dashboard dark theme (navy background, cyan/red accent for Yes/Cancel)
- [x] T016 [US2] Wire `ConfirmActionCard` into `frontend/components/agent/AgentChatPanel.tsx` â€” when last API response has `type === 'confirmation'` and `pendingAction.type === 'remove_client'`: store `pendingAction` in state; render `<ConfirmActionCard>` below the message list with client details; on `onConfirm(true)` â†’ call `sendMessage` with `pendingAction` and `confirmed:true`; on `onConfirm(false)` â†’ call `sendMessage` with `pendingAction` and `confirmed:false`; clear `pendingAction` from state after either callback
- [ ] T017 [US2] Manual acceptance test for US2 â€” verify all 5 acceptance scenarios from spec.md: (a) single match â†’ confirmation card shows â†’ Yes â†’ deleted; (b) single match â†’ Cancel â†’ client unchanged; (c) 2 clients named Sarah â†’ clarification response lists both; (d) unknown name â†’ "not found" text; (e) Free user direct call â†’ 403; also verify the deleted client no longer appears in the main client list (page refresh)

**Checkpoint US2**: US2 is complete when T017 passes all five scenarios. US1 still works (regression check: add a client then remove it).

---

## Phase 5: User Story 3 â€” Send an Email to a Client via Conversation (Priority: P3)

**Goal**: Pro user describes an email in natural language; agent generates a draft (using existing `generateEmail()`), shows it in a card with Send/Cancel buttons; email is sent via Gmail only after explicit "Send" confirmation. Ambiguous/missing clients handled gracefully.

**Independent Test**: Type "Email Ahmed about the new listing" in UI; verify draft card appears with subject + body. Click Send â†’ email in Gmail Sent + record in emails table. Click Cancel instead â†’ no email sent. Type "Email Marcus" (unknown) â†’ "not found" text response.

- [x] T018 [P] [US3] Implement `handleSendEmail` in `frontend/lib/agent/handlers.ts` â€” signature: `handleSendEmail(supabase: SupabaseClient, userId: string, client: {id:string;name:string;email:string}, draft: {subject:string;body:string}): Promise<AgentActionResultResponse>`; (1) call `sendGmail(userId, client.email, draft.subject, draft.body)` from `lib/gmail/send.ts`; (2) INSERT email audit record into `emails` table: `{user_id:userId, client_id:client.id, subject:draft.subject, body:draft.body, status:'sent', sent_at:new Date().toISOString()}`; (3) return `{type:'action_result', content:'Email sent to [name]. âœ“', success:true}`; on `GmailSendError` â†’ return `{type:'action_result', content:'Gmail send failed â€” please check your Gmail connection and try again.', success:false}` (do NOT re-throw)
- [x] T019 [P] [US3] Wire `send_email` tool call in `frontend/app/api/agent/chat/route.ts` â€” when `tool_call.function.name === 'send_email'`: (1) parse `client_identifier` and `instructions` args, (2) fetch user clients, (3) if `gmail_token` is null â†’ return `{type:'text', content:'Your Gmail account isn\'t connected. Please reconnect Gmail in Settings before sending emails.'}` (early exit, no fuzzy match needed), (4) fuzzy match clients: 0 â†’ not-found text; 2+ â†’ clarification response; 1 match â†’ call `generateEmail({text:instructions, type:'manual', tone:'friendly', clientName:client.name, senderName:profile.name, isPro:true})` from `lib/ai/generate.ts`, return `{type:'confirmation', content:'Here\'s your draft email to [name]. Ready to send?', pendingAction:{type:'send_email', client:{id,name,email}, draft:{subject,body}}}`
- [x] T020 [US3] Handle confirmed `send_email` pending action in `frontend/app/api/agent/chat/route.ts` â€” in the `pendingAction.confirmed === true` block: when `pendingAction.action.type === 'send_email'`, extract `client` and `draft` from `pendingAction.action`, call `handleSendEmail(supabase, user.id, client, draft)`, return handler result
- [x] T021 [P] [US3] Create `frontend/components/agent/EmailDraftCard.tsx` â€” props: `to: {name:string;email:string}`, `subject: string`, `body: string`, `onConfirm: (confirmed: boolean) => void`, `isLoading: boolean`; renders card with "To:", "Subject:", scrollable "Body:" sections, "Send Email" primary button and "Cancel" secondary button; buttons disabled while `isLoading`; styled with Tailwind to match dashboard dark theme (navy background, cyan accent)
- [x] T022 [US3] Wire `EmailDraftCard` into `frontend/components/agent/AgentChatPanel.tsx` â€” when last API response has `type === 'confirmation'` and `pendingAction.type === 'send_email'`: store `pendingAction` in state; render `<EmailDraftCard>` below the message list with `to`, `subject`, `body`; on `onConfirm(true)` â†’ send with `confirmed:true`; on `onConfirm(false)` â†’ send with `confirmed:false`; clear `pendingAction` from state after either callback; `isLoading` passed from panel state
- [ ] T023 [US3] Manual acceptance test for US3 â€” verify all 5 acceptance scenarios from spec.md: (a) known client â†’ draft card appears; (b) click Send â†’ email in Gmail Sent folder + record in Supabase `emails` table; (c) click Cancel â†’ no email; (d) unknown client â†’ "not found" text; (e) ambiguous client â†’ clarification; also verify (f) disconnected Gmail â†’ helpful reconnect message; (g) Free user â†’ 403

**Checkpoint US3**: US3 complete when T023 passes all seven scenarios. All three tool actions now work end-to-end.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Dashboard integration, loading UX, edge-case hardening, theming. These tasks touch multiple stories and should be done after all three tool stories are validated.

- [x] T024 [P] Integrate `AgentChatPanel` into `frontend/components/layout/DashboardShell.tsx` â€” add a floating toggle button (bottom-right, `z-50`, Lucide `MessageSquare` icon, navy/cyan styling); clicking it sets `isOpen` state; render `<AgentChatPanel user={user} />` in a fixed-position container (bottom-right, 400px wide, 600px tall, above nav bar); component already guards itself for free users, but only render the toggle button when `user.plan !== 'free'`
- [x] T025 [P] Add loading state to `frontend/components/agent/AgentChatPanel.tsx` â€” while `isLoading === true`: disable input and submit button; show a "MailMind is thinking..." assistant bubble with a pulsing animation (Tailwind `animate-pulse`); prevent double-submit (check `isLoading` before calling API)
- [x] T026 [P] Harden Gmail-disconnected path in `frontend/app/api/agent/chat/route.ts` â€” ensure `gmail_token` null check for `send_email` (added in T019) also handles the case where the tool call executes during the confirmed path (T020): before calling `handleSendEmail`, re-check `profile.gmail_token` is not null and return an appropriate error response rather than letting `sendGmail` throw
- [ ] T027 [P] Verify out-of-scope request handling â€” in the running app, send messages that are outside the three supported actions (e.g. "What's the weather?", "Write me a poem", "Email all my clients") and verify the agent responds conversationally, reminds the user of its three capabilities, and does NOT throw an error or return a 500; adjust SYSTEM_PROMPT in `lib/agent/tools.ts` if responses are not sufficiently redirecting
- [x] T028 Apply dashboard theming to all agent components â€” review `AgentChatPanel`, `AgentMessage`, `ConfirmActionCard`, `EmailDraftCard`; ensure all use the existing Tailwind color palette from `globals.css` (navy background, cyan accent, orange highlight, white text); no default browser styling or OpenAI-style light theme; match border-radius and shadow depth to the rest of the dashboard; test on mobile viewport (320px min-width)

**Final Checkpoint**: Run through all 13 acceptance test scenarios from `quickstart.md` end-to-end in a browser. Confirm SC-007 (panel interactive within 2 seconds). Confirm SC-004 (free user sees no toggle button, direct API call returns 403).

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ T001â†’T002,T003,T004 (parallel)
       â”‚
       â–¼
Phase 2 (Foundational/US4) â”€â”€â”€â”€â”€â”€â”€â”€â”€ T005â†’T006 (sequential, same file)
       â”‚                              T007 (parallel with T005, different file)
       â”‚                              T008 (after T007, imports AgentMessage)
       â”‚
       â–¼
Phase 3 (US1 Add Client) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ T009â†’T010â†’T011 (sequential)
       â”‚
       â–¼
Phase 4 (US2 Remove Client) â”€â”€â”€â”€â”€â”€â”€â”€ T012[P], T013[P], T015[P] (parallel start)
       â”‚                              T014 after T013 (same file)
       â”‚                              T016 after T015 (imports ConfirmActionCard)
       â”‚                              T017 after T016 (manual test)
       â”‚
       â–¼
Phase 5 (US3 Send Email) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ T018[P], T019[P], T021[P] (parallel start)
       â”‚                              T020 after T019 (same file)
       â”‚                              T022 after T021 (imports EmailDraftCard)
       â”‚                              T023 after T022 (manual test)
       â”‚
       â–¼
Phase 6 (Polish) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ T024[P], T025[P], T026[P], T027[P] (parallel)
                                      T028 after T024 (reviews all components)
```

### User Story Dependencies

- **US4 (access gating, P1)**: No dependencies â€” goes into Phase 2 Foundational; BLOCKS all other stories
- **US1 (add client, P1)**: Requires Phase 2 complete â€” no dependency on US2 or US3
- **US2 (remove client, P2)**: Requires Phase 2 + US1 complete (fuzzy matching tested via US1 context)
- **US3 (send email, P3)**: Requires Phase 2 + US1 + US2 complete (confirms confirmation flow pattern is proven)

### Within Each Story

- Handlers (`lib/agent/handlers.ts`) before route wiring
- Route wiring before UI components (can be parallelized with components since they're different files)
- UI components before panel integration
- Panel integration before manual acceptance test

---

## Parallel Execution Examples

### Phase 1 Parallel

```
Simultaneously:
  T002 â†’ lib/agent/fuzzy.ts
  T003 â†’ lib/agent/tools.ts
  T004 â†’ lib/agent/types.ts
```

### Phase 4 (US2) Parallel Start

```
Simultaneously after Phase 3 complete:
  T012 â†’ handlers.ts (handleRemoveClient)
  T013 â†’ route.ts (remove_client tool wiring)
  T015 â†’ components/agent/ConfirmActionCard.tsx
Then sequential:
  T014 after T013 â†’ route.ts (confirmed path)
  T016 after T015 â†’ AgentChatPanel.tsx (wire ConfirmActionCard)
  T017 after T016 â†’ manual acceptance test
```

### Phase 5 (US3) Parallel Start

```
Simultaneously after Phase 4 complete:
  T018 â†’ handlers.ts (handleSendEmail)
  T019 â†’ route.ts (send_email tool wiring)
  T021 â†’ components/agent/EmailDraftCard.tsx
Then sequential:
  T020 after T019 â†’ route.ts (confirmed path)
  T022 after T021 â†’ AgentChatPanel.tsx (wire EmailDraftCard)
  T023 after T022 â†’ manual acceptance test
```

---

## Implementation Strategy

### MVP First (US4 + US1 Only â€” 11 tasks)

1. Complete Phase 1: Setup (T001â€“T004)
2. Complete Phase 2: Foundational (T005â€“T008)
3. Complete Phase 3: US1 Add Client (T009â€“T011)
4. **STOP and VALIDATE**: Free user blocked (403), Pro user can add a client via chat
5. Deploy/demo if ready â€” this is already a genuinely useful Pro feature

### Incremental Delivery

1. Setup + Foundational â†’ Auth gate proven, basic chat panel renders
2. Add US1 (T009â€“T011) â†’ Add-client via conversation works â†’ **Demo-able MVP**
3. Add US2 (T012â€“T017) â†’ Remove with confirmation â†’ **Confirms confirmation pattern**
4. Add US3 (T018â€“T023) â†’ Email send â†’ **Full v1 feature complete**
5. Polish (T024â€“T028) â†’ Dashboard integration, theming, edge cases â†’ **Production-ready**

---

## Task Summary

| Phase | Tasks | Story | Count |
|---|---|---|---|
| Phase 1: Setup | T001â€“T004 | â€” | 4 |
| Phase 2: Foundational | T005â€“T008 | US4 | 4 |
| Phase 3: Add Client | T009â€“T011 | US1 | 3 |
| Phase 4: Remove Client | T012â€“T017 | US2 | 6 |
| Phase 5: Send Email | T018â€“T023 | US3 | 6 |
| Phase 6: Polish | T024â€“T028 | cross | 5 |
| **Total** | | | **28** |

**Parallel opportunities**: 14 tasks marked [P]  
**Sequential critical path**: T001 â†’ T005 â†’ T006 â†’ T009 â†’ T010 â†’ T013 â†’ T014 â†’ T019 â†’ T020 â†’ T024 â†’ T028 (11 tasks)

---

## Notes

- Tasks cite exact file paths â€” each task is completable without additional context lookup
- Reuse contracts: `lib/ai/generate.ts`, `lib/gmail/send.ts`, `lib/plan-limits.ts`, `lib/supabase/server.ts` â€” do NOT duplicate their logic
- No database migrations needed â€” zero schema changes
- No new npm packages â€” uses existing `openai`, `@supabase/ssr`, `googleapis`
- Commit after each task or logical group to enable rollback
- If Gemini tool calling is unreliable via OpenRouter in testing, check OpenRouter model capabilities docs â€” Gemini 2.5 Flash supports function calling
