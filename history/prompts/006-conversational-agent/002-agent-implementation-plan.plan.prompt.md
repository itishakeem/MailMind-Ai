---
id: "002"
title: "Agent Implementation Plan"
stage: plan
date: 2026-06-22
surface: agent
model: claude-sonnet-4-6
feature: "006-conversational-agent"
branch: 006-conversational-agent
user: Abdul Hakeem
command: /sp.plan
labels: ["agent", "architecture", "tool-calling", "gemini", "custom-ui", "pro-feature"]
links:
  spec: specs/006-conversational-agent/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/006-conversational-agent/plan.md
  - specs/006-conversational-agent/research.md
  - specs/006-conversational-agent/data-model.md
  - specs/006-conversational-agent/quickstart.md
  - specs/006-conversational-agent/contracts/agent-chat.md
tests:
  - null
---

## Prompt

now read the specs and update plans. strictly follow spec-driven development

## Response snapshot

Read spec.md, constitution.md, and researched the codebase via 3 parallel agents. Key findings:
- clients table has no `category` column → use `company` instead
- Plan values are 'free'|'pro'|'business' (not 'agency' as build spec stated)
- @openai/chatkit-react is not a real public npm package → custom React + Tailwind chat UI
- All reuse targets confirmed: generateEmail(), sendGmail(), assertPlanLimit(), server Supabase client

Generated all Phase 0 + Phase 1 artifacts:
- research.md: 8 decisions, all NEEDS CLARIFICATION resolved
- data-model.md: existing tables + 3 runtime TypeScript interfaces (ConversationMessage, PendingAction, AgentResponse)
- contracts/agent-chat.md: full POST /api/agent/chat contract with request/response types, error codes, processing flow, tool definitions, system prompt
- quickstart.md: 5-step build order, new/modified file list, env var summary, code snippets
- plan.md: complete implementation plan with constitution check (all 6 pass), architecture decision, risks

Constitution check: all 6 principles pass. No violations. ADR flagged for chatkit-vs-custom-ui decision.

## Outcome

- ✅ Impact: Complete implementation plan for conversational agent — single route, custom UI, zero new npm packages, zero DB migrations
- 🧪 Tests: No tests run (plan stage)
- 📁 Files: plan.md, research.md, data-model.md, quickstart.md, contracts/agent-chat.md
- 🔁 Next prompts: /sp.tasks to generate task breakdown; /sp.adr chatkit-vs-custom-ui to document the ChatKit decision
- 🧠 Reflection: The build spec's ChatKit proposal was the biggest blocker — it's not a real public package. Detecting this early and pivoting to custom UI prevents a dead-end during implementation. The rest of the spec mapped cleanly to existing codebase patterns.

## Evaluation notes (flywheel)

- Failure modes observed: Build spec referenced @openai/chatkit-react (fictional package) and 'agency' plan tier (doesn't exist in DB). Both caught during Phase 0 research by inspecting actual code.
- Graders run and results (PASS/FAIL): Constitution check — all 6 principles PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Run /sp.tasks to validate that the plan decomposes into independently testable tasks without gaps
