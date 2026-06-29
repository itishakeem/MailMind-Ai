---
id: "017"
title: Real-time Log Utility
stage: general
date: 2026-06-28
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: Abdul Hakeem
command: create util log.py to check real time logs of this application
labels: ["tooling","logging","devops","monitoring"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - log.py
tests:
  - manual: python log.py --help
  - manual: python log.py --filter agent
  - manual: python log.py --mode prod --level error
---

## Prompt

create util log.py to check real time logs of this appliaction

## Response snapshot

Created `log.py` in the project root. The script:

- **`--mode dev`** (default): spawns `npm run dev` inside `frontend/` and pipes stdout through a colorised parser. Works on Windows (uses `npm.cmd`).
- **`--mode prod`**: calls `vercel logs --follow` to tail production logs (requires `vercel` CLI logged in).
- **`--filter <tags>`**: comma-separated module tags — `agent`, `cron`, `send`, `gmail`, `OTP`, `Mailer`, `webhook`, `flush-due`, `LS checkout`, `password-reset`, `contact` — all derived from the actual `[tag]` prefixes used in the codebase.
- **`--level error|warn|info`**: hides lines below the chosen severity.
- ANSI colours: errors=red, warnings=yellow, HTTP routes show method/status/latency, startup banners=green, module tags coloured by service.

## Outcome

- ✅ Impact: Developers can now stream and filter app logs without wading through raw Next.js output.
- 🧪 Tests: Manual — run `python log.py --help` to verify flags; `python log.py --filter agent` to confirm module filtering.
- 📁 Files: log.py (new)
- 🔁 Next prompts: Add `--mode supabase` to tail Supabase Realtime or Postgres logs via the Supabase management API.
- 🧠 Reflection: Chose subprocess pipe over log-file tailing because Next.js writes to stdout, not a file. Windows-specific `npm.cmd` / `vercel.cmd` handled explicitly.

## Evaluation notes (flywheel)

- Failure modes observed: none during creation
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment: add Supabase log tailing via management API
