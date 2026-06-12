<!--
SYNC IMPACT REPORT
==================
Version change: 0.0.0 (template) → 1.0.0 (initial constitution)
Modified principles: All (new — derived from MailMind-AI-English.md)
Added sections:
  - Core Principles (6 principles)
  - Technology Constraints
  - Development Workflow
  - Governance
Removed sections: All template placeholders replaced
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ Constitution Check gates align with principles
  - .specify/templates/spec-template.md ✅ Functional requirements align with security/privacy principles
  - .specify/templates/tasks-template.md ✅ Task phases align with phased launch strategy
Follow-up TODOs:
  - TODO(RATIFICATION_DATE): Date set to first-write date 2026-06-12; confirm with team if a formal ratification ceremony is preferred.
-->

# MailMind AI Constitution

## Core Principles

### I. Security & Privacy First

All user credentials and Gmail OAuth tokens MUST be stored encrypted at rest.
Gmail OAuth MUST request only the minimum required scope (send permission only — never read/delete).
Passwords MUST NOT be stored in plain text; JWT sessions MUST use short-lived tokens with refresh rotation.
OAuth tokens MUST be revocable by the user at any time from the Settings page.
No third-party service MAY receive a user's Gmail access token except the Gmail API itself.

**Rationale**: Trust is MailMind AI's primary product asset. A single credential leak would
destroy user confidence and violate Google's OAuth policy. Minimum-scope OAuth is also a
Google API requirement to maintain API access.

### II. AI-Augmented, Human-Confirmed

AI email generation MUST produce a draft that the user reviews before any email is dispatched.
The system MUST NOT send any email autonomously without an explicit "Send Now" or a user-configured
scheduled trigger that the user deliberately set up.
AI context detection (invoice / reminder / update / proposal) MUST surface its detected type to
the user in the compose preview so the user can correct misclassification.
Tone selection (Friendly / Formal / Strict) MUST be user-controlled; the AI MUST NOT override it.

**Rationale**: Emails are sent from the user's own Gmail address. An erroneously sent email
damages the user's professional reputation, not MailMind AI's. Human confirmation is non-negotiable.

### III. Simplicity-Driven UX

Every core user task MUST be completable in a single, clearly labelled action (one task, one click).
Page load times MUST target zero perceptible delay; skeleton/loading states MUST be used for any
operation expected to exceed 300 ms.
UI copy MUST be plain language; no technical jargon exposed to end users.
The design language MUST maintain a premium, trust-inspiring aesthetic (professional, not playful).

**Rationale**: The target market (South Asian freelancers and small businesses) values speed and
professionalism. Complexity is a churn driver; simplicity is a retention driver.

### IV. Graceful Degradation & Resilience

The AI pipeline MUST implement a two-tier fallback:
  1. Primary: Gemini Flash via OpenRouter (paid, production)
  2. Fallback: Nemotron 3 Super via NVIDIA (free, beta / burst protection)
When the AI pipeline fails entirely, the system MUST allow the user to compose and send a manual
email rather than blocking the workflow.
Gmail API failures MUST surface a user-actionable error message and MUST NOT silently drop emails.
Scheduled email delivery failures MUST trigger a user notification and retain the email in a
"failed" state for retry.

**Rationale**: Freelancers depend on timely client communication. Silent failures translate
directly to lost revenue and lost trust.

### V. Cost-Conscious Scalability

Every infrastructure choice MUST start on a free or near-free tier and graduate to paid only
when revenue justifies it (per the AI Cost Strategy in the project documentation).
AI token usage MUST be estimated before a request is sent; requests that would exceed the
monthly budget threshold MUST be queued or deferred, never silently over-spent.
New third-party integrations MUST document their unit cost per 1,000 active users before merging.

**Rationale**: MailMind AI is bootstrapped. Uncontrolled cloud spend before product-market fit
kills the company. Revenue must cover infrastructure before infrastructure scales.

### VI. Data Ownership & Auditability

All emails (draft / scheduled / sent) MUST be persisted in the `emails` table with status
and timestamps, providing a complete audit trail per client.
Users MUST be able to export or delete their data on request (GDPR/PDPA readiness).
The `documents` table MUST store only extracted text, not binary PDF blobs, to minimise storage
cost and exposure of original documents.
No user data MAY be used for AI model training without explicit, opt-in consent.

**Rationale**: Data ownership builds long-term trust. Audit trails protect the user in client
disputes. Regulatory readiness avoids future re-engineering costs.

## Technology Constraints

The following stack is fixed for this project. Deviations require an ADR and explicit approval.

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 + Tailwind CSS |
| AI Primary | Gemini Flash via OpenRouter |
| AI Fallback | Nemotron 3 Super (NVIDIA) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + Google OAuth 2.0 |
| Gmail | Google Gmail API (OAuth 2.0) |
| PDF Parsing | pdf-parse (npm) |
| Scheduling | Vercel Cron Jobs |
| Deployment | Vercel |

All secrets and API keys MUST be stored in environment variables and MUST NOT be committed to
the repository. A `.env.example` file MUST document every required variable.

## Development Workflow

Development follows the four-phase launch strategy defined in the project documentation:

- **Phase 1 — Build** (Weeks 1–4): Core auth, Gmail OAuth, client management, AI integration,
  scheduling, deploy.
- **Phase 2 — Beta** (Month 2): 10 trusted users, real feedback, bug fixes, UI polish.
- **Phase 3 — Public Launch** (Month 3): Social distribution, freelancer communities, referral program.
- **Phase 4 — Growth** (Month 4+): SEO content, paid ads once revenue is stable.

Feature work MUST align with the current phase. Features planned for Phase 4 MUST NOT be
implemented in Phase 1 (no over-engineering).

All pricing plan limits (Free: 10 emails/3 clients; Pro: unlimited; Business: team + analytics)
MUST be enforced at the API layer, not only in the UI.

## Governance

This constitution supersedes all other development practices and coding guidelines.
All pull requests MUST pass a Constitution Check verifying compliance with the six core principles
before merge.

**Amendment Procedure**:
1. Propose the change in writing, citing the principle being modified and the reason.
2. Assess version bump: PATCH for wording, MINOR for new principle/section, MAJOR for
   removal or redefinition of an existing principle.
3. Update `LAST_AMENDED_DATE` and `CONSTITUTION_VERSION` in the version line below.
4. Run the consistency propagation checklist (templates, commands, docs) and record results
   in the Sync Impact Report comment at the top of this file.
5. ADR MUST be created for any MAJOR or MINOR version bump.

**Compliance Review**: Every sprint retrospective MUST include a one-question check —
"Did any work this sprint violate a constitution principle?" If yes, create a remediation task.

**Version**: 1.0.0 | **Ratified**: 2026-06-12 | **Last Amended**: 2026-06-12
