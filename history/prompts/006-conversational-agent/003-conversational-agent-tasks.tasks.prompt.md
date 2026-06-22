---
id: "003"
title: "Conversational Agent Tasks"
stage: tasks
date: 2026-06-22
surface: agent
model: claude-sonnet-4-6
feature: "006-conversational-agent"
branch: 006-conversational-agent
user: Abdul Hakeem
command: /sp.tasks
labels: ["agent", "tasks", "tool-calling", "pro-feature", "chat-ui", "gemini"]
links:
  spec: specs/006-conversational-agent/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/006-conversational-agent/tasks.md
tests:
  - null
---

## Prompt

now read spec and plan to update executable tasks. follow SDD rule stay consistent

## Response snapshot

Loaded spec.md (4 user stories), plan.md (architecture), data-model.md, contracts/agent-chat.md,
research.md, quickstart.md. Generated tasks.md with 28 tasks across 6 phases:

Phase 1 (Setup, T001–T004): Directory structure, fuzzy.ts, tools.ts, types.ts — all [P]
Phase 2 (Foundational/US4, T005–T008): Route skeleton with auth+plan gate, Gemini core, AgentMessage component, AgentChatPanel shell
Phase 3 (US1 Add Client, T009–T011): handleAddClient handler, route wiring, manual acceptance test
Phase 4 (US2 Remove Client, T012–T017): handleRemoveClient, remove_client route wiring, confirmed path, ConfirmActionCard, panel wiring, acceptance test
Phase 5 (US3 Send Email, T018–T023): handleSendEmail, send_email wiring with generateEmail(), confirmed path, EmailDraftCard, panel wiring, acceptance test
Phase 6 (Polish, T024–T028): Dashboard floating button, loading state, Gmail-disconnected hardening, out-of-scope handling, theming

14/28 tasks marked [P] (parallelizable). Sequential critical path is 11 tasks.
MVP = Phases 1+2+3 (11 tasks): Pro user can add a client via conversation.

## Outcome

- ✅ Impact: 28 immediately-executable tasks covering all 4 user stories; each story phase is independently testable
- 🧪 Tests: Manual acceptance tests at T011 (US1), T017 (US2), T023 (US3); all map directly to spec.md acceptance scenarios
- 📁 Files: specs/006-conversational-agent/tasks.md
- 🔁 Next prompts: /sp.implement to begin building; /sp.adr chatkit-vs-custom-ui to document the key arch decision
- 🧠 Reflection: US4 (access gating) correctly placed in Foundational phase since it blocks all stories. US3 (send email) correctly last since it depends on the confirmation pattern proven by US2. Task granularity is tight — each task names its exact file and function, making them LLM-executable without additional context.

## Evaluation notes (flywheel)

- Failure modes observed: None in this session
- Graders run and results (PASS/FAIL): Format validation — all 28 tasks have checkbox, ID, [P?], [Story?], description with file path. PASS.
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Run /sp.implement to execute tasks in order and observe whether task granularity is correct (not too coarse, not too fine-grained)
