# MailMind AI

> AI-powered email automation SaaS — draft, schedule, and send personalised client emails via Gmail, driven by a conversational AI agent.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss)

---

## What it does

| Feature | Description |
|---|---|
| **AI Email Agent** | Conversational agent that asks for context, picks tone, and drafts professional emails |
| **Gmail Integration** | OAuth2 connection — send directly from your own Gmail address |
| **Email Scheduling** | Queue emails for future delivery; Vercel Cron sends them on time |
| **Client CRM** | Manage clients, attach notes, track email history per contact |
| **AI Type Detection** | Automatically classifies email type (follow-up, proposal, invoice, etc.) |
| **Admin Dashboard** | Full RBAC admin panel — user management, analytics, contact messages |
| **Payments** | Lemon Squeezy subscriptions (Free / Pro / Business) |
| **Dark Mode** | Five gradient themes, full dark/light support |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 + CSS variables design system |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| AI | OpenRouter (Gemini 2.5 Flash for email gen, free tier for agent) |
| Gmail | Google Gmail API via OAuth2 |
| Payments | Lemon Squeezy |
| Email (OTP/transactional) | Nodemailer + Gmail App Password |
| Cron | Vercel Cron Jobs |
| Deployment | Vercel |

---

## Project Structure

```
MailMind-Ai/
├── frontend/                  # Next.js application
│   ├── app/
│   │   ├── (admin)/           # Admin dashboard (RBAC-protected)
│   │   │   └── admin/
│   │   │       ├── page.tsx         # Platform overview
│   │   │       ├── users/           # User management
│   │   │       ├── analytics/       # Email analytics
│   │   │       └── contacts/        # Contact form submissions
│   │   ├── (dashboard)/       # Main app (auth-protected)
│   │   │   ├── dashboard/
│   │   │   ├── clients/
│   │   │   ├── compose/
│   │   │   ├── scheduled/
│   │   │   ├── settings/
│   │   │   └── profile/
│   │   ├── api/               # Route handlers
│   │   │   ├── admin/         # Admin-only endpoints
│   │   │   ├── agent/         # AI agent chat
│   │   │   ├── ai/            # Email generation + type detection
│   │   │   ├── emails/        # Send / schedule / manage emails
│   │   │   ├── gmail/         # OAuth2 connect / callback
│   │   │   ├── payments/      # Lemon Squeezy webhooks + checkout
│   │   │   └── cron/          # Scheduled email dispatcher
│   │   └── auth/              # Login / signup / OTP / reset
│   ├── components/
│   │   ├── admin/             # Admin UI (shell, tables, charts)
│   │   ├── auth/              # Login / signup forms
│   │   ├── dashboard/         # Charts, stat cards
│   │   └── ui/                # Shared primitives (Toast, etc.)
│   ├── lib/
│   │   ├── supabase/          # Client, server, admin helpers
│   │   └── gmail/             # Gmail send / token helpers
│   ├── types/                 # Shared TypeScript types + RBAC helpers
│   ├── middleware.ts           # Session refresh + route protection
│   └── vercel.json            # Cron job configuration
├── backend/
│   └── supabase/migrations/   # SQL migration files
├── specs/                     # Feature specs and plans
└── history/prompts/           # Prompt History Records (PHR)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google Cloud](https://console.cloud.google.com) project with Gmail API enabled
- An [OpenRouter](https://openrouter.ai) account
- A [Lemon Squeezy](https://www.lemonsqueezy.com) store

### 1. Clone and install

```bash
git clone https://github.com/itishakeem/MailMind-Ai.git
cd MailMind-Ai/frontend
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in every value in `.env.local` — see the comments in `.env.example` for where to find each one.

### 3. Apply database migrations

Run the SQL files in `backend/supabase/migrations/` in order via the [Supabase SQL editor](https://supabase.com/dashboard/project/_/sql/new):

```
001_initial_schema.sql
...
012_rbac_roles.sql
```

### 4. Bootstrap the admin account

```bash
cd frontend
node setup-admin.mjs
```

This creates the admin user and sets their role to `super_admin`.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GMAIL_REDIRECT_URI` | OAuth callback URL (use your production domain in prod) |
| `OPENROUTER_API_KEY` | OpenRouter key for email generation |
| `OPENROUTER_API_KEY_FREE` | OpenRouter free-tier key for agent calls |
| `ENCRYPTION_KEY` | 64-char hex key for AES-256 Gmail token encryption |
| `CRON_SECRET` | Secret to authenticate Vercel Cron calls |
| `MAILER_USER` | Gmail address for OTP/transactional emails |
| `MAILER_APP_PASSWORD` | Gmail App Password (16 chars) |
| `LEMONSQUEEZY_API_KEY` | Lemon Squeezy API key |
| `LEMONSQUEEZY_STORE_ID` | Lemon Squeezy store ID |
| `LEMONSQUEEZY_PRO_VARIANT_ID` | Pro plan variant ID |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Webhook signing secret |

Generate random secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## RBAC Roles

| Role | Access |
|---|---|
| `user` | Standard app access |
| `support` | Read-only admin dashboard |
| `moderator` | Admin dashboard + change user plans |
| `admin` | Moderator + delete users |
| `super_admin` | Full access including role changes |

Roles are stored as `TEXT` in the `users` table — adding new roles requires zero schema changes.

---

## Deploying to Vercel

See the [Deployment Guide](#deployment-guide) section below.

### One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/itishakeem/MailMind-Ai&root=frontend)

### Manual deploy

1. Push this repo to GitHub
2. Import at [vercel.com/new](https://vercel.com/new)
3. **Set Root Directory to `frontend`**
4. Add all environment variables from `.env.example`
5. Deploy

After deploy, update:
- **Supabase** → Authentication → URL Configuration → add your Vercel domain to Redirect URLs
- **Google Cloud Console** → OAuth Credentials → add `https://your-domain.vercel.app/api/gmail/callback`
- **Lemon Squeezy** → Webhooks → update URL to `https://your-domain.vercel.app/api/payments/webhook`

---

## Deployment Guide

### Vercel environment variables

Set these in **Vercel Dashboard → Project → Settings → Environment Variables**:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GMAIL_REDIRECT_URI          ← use production URL here
OPENROUTER_API_KEY
OPENROUTER_API_KEY_FREE
ENCRYPTION_KEY
CRON_SECRET
MAILER_USER
MAILER_APP_PASSWORD
LEMONSQUEEZY_API_KEY
LEMONSQUEEZY_STORE_ID
LEMONSQUEEZY_PRO_VARIANT_ID
LEMONSQUEEZY_WEBHOOK_SECRET
```

### Cron job

The `vercel.json` in `frontend/` configures a cron job that runs every 5 minutes to dispatch scheduled emails:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-scheduled",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This requires a **Vercel Pro** plan. On the free plan, remove the cron config and trigger manually.

---

## Security

- All secrets in environment variables — never committed
- Supabase Row Level Security (RLS) enforced on all tables
- Admin routes double-guarded: middleware (layout) + `requireRole()` (API)
- Gmail tokens encrypted at rest with AES-256-GCM
- CSP, HSTS, X-Frame-Options, and other security headers set in `next.config.mjs`
- Service role key used server-side only, never exposed to the client

---

## License

MIT
