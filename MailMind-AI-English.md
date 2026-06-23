# MailMind AI — Complete Documentation

> **Give us your work details — AI sends professional emails to your clients on your behalf**

---

## App Name
**MailMind AI**
*Tagline: Your Work. Your Email. AI-Powered.*

---

## Problem It Solves

Freelancers and small businesses deal with these tasks daily:
- Sending invoices to clients
- Sending payment reminders
- Sharing work updates
- Writing follow-up emails

Writing all of this manually is time-consuming and difficult.
**MailMind AI handles all of this automatically — from your own Gmail.**

---

## How It Works (Complete Flow)

```
1. User creates an account
         ↓
2. Connects Gmail via OAuth (one-time setup)
         ↓
3. Adds a client (name, email, phone)
         ↓
4. Uploads a PDF or writes a description
         ↓
5. AI detects the context:
   invoice? reminder? update?
         ↓
6. AI generates a professional email
         ↓
7. User previews and edits if needed
         ↓
8. Clicks "Send Now" or schedules it
         ↓
9. Email is sent from the USER'S Gmail ✅
```

---

## Gmail OAuth Flow

```
User clicks "Connect Gmail"
         ↓
Google's official popup appears:
"MailMind AI wants to send
emails on your behalf"
         ↓
User clicks "Allow"
         ↓
App stores Gmail access token (encrypted)
         ↓
All emails now sent from user's Gmail ✅
```

**Security:**
- Password is never stored
- Only send permission is granted
- Can be revoked anytime
- Uses Google's official OAuth 2.0 system

---

## What AI Detects

```
From PDF or text, AI understands:

Invoice?      → "Payment is due, send a reminder"
Contract?     → "Agreement needs to be signed"
Report?       → "Share the monthly report"
General info? → "Send a professional update"
```

---

## AI Email Example

**User Input:**
> "Website design is complete, need to collect Rs. 15,000, due in 7 days"

**AI Generated Email:**
```
Subject: Invoice for Website Design Services — Rs. 15,000

Dear [Client Name],

I hope this message finds you well.

I am writing to share the invoice for the website
design project we recently completed for you.

Project: Website Design & Development
Amount Due: Rs. 15,000
Due Date: [Date + 7 days]

Kindly process the payment within the mentioned
timeframe. Please feel free to reach out if you
have any questions.

Best regards,
[Your Name]
```

---

## Core Features

### Authentication
- Email/Password signup & login
- Google OAuth login
- Secure JWT sessions

### Gmail Integration
- Gmail OAuth connect (one-time setup)
- Emails sent from the user's own Gmail
- Password is never stored
- Can be disconnected anytime

### Client Management
- Add / edit / delete clients
- Store name, email, phone, company, address
- Full email history per client

### AI Email Generation
- Upload a PDF — AI detects the content
- Or write a text description
- AI understands: invoice, reminder, update, proposal
- Generates professional email (subject + body)
- Tone options: Friendly / Formal / Strict
- User can preview, edit, then send

### Send Options
- **Send Now** — Send immediately
- **Schedule** — Set a date & time, sends automatically

### Alex — AI Chat Agent
- Conversational AI assistant embedded in the dashboard
- Available to all plans (Free: 10 messages/24 hrs, Pro/Business: unlimited)
- Responds in the user's own language (English, Urdu, Arabic, etc.)
- **6 agent tools:**
  1. List clients
  2. Add a client (name + email required; company & phone optional)
  3. Update a client's info (name, email, company, phone)
  4. Remove a client (always confirms before deleting)
  5. Send an email to a client (shows draft for approval before sending)
  6. Generate a PDF activity report (last 24h, 7-day, or 30-day)
- Chat history persisted per session (up to 15 sessions saved locally)

### Dashboard & Analytics
- Total emails sent this month
- Pending scheduled emails
- Per client activity
- Free plan usage rings (emails & clients)

---

## Pages / Screens

```
/ — Landing Page
├── Hero section
├── Features
├── Pricing
└── Sign up CTA

/auth/signup — Create account
/auth/login  — Login

/dashboard
├── Stats (emails sent, pending, clients)
├── Recent activity
└── Quick compose button

/clients
├── Client list
├── Add/edit client
└── Per client email history

/compose
├── Select client
├── Upload PDF or write description
├── AI email preview
├── Select tone
└── Send Now / Schedule

/scheduled
├── Upcoming scheduled emails
└── Cancel / reschedule option

/settings
├── Gmail connect/disconnect
├── Email signature
├── Plan & billing
└── Profile
```

---

## Tech Stack

| Layer | Technology | Cost |
|---|---|---|
| **Frontend** | Next.js 14 + Tailwind CSS | Free |
| **AI (Pro/Business)** | Gemini 2.5 Flash via OpenRouter | $5 = 50,000 emails |
| **AI (Free tier)** | OpenRouter Auto (best free model) | Free |
| **Database** | Supabase (PostgreSQL) | Free tier |
| **Auth** | Supabase Auth + Google OAuth | Free |
| **Gmail** | Google Gmail API (OAuth 2.0) | Free |
| **PDF Reading** | pdf-parse (npm) | Free |
| **Scheduling** | Vercel Cron Jobs | Free |
| **Deployment** | Vercel | Free |

---

## AI Cost Strategy

```
Beta Phase (10 users):
→ Nemotron 3 Super — FREE
→ 200 requests/day is enough

Public Launch (100 users):
→ Gemini Flash via OpenRouter
→ $5 top up = 50,000 emails
→ Lasts for months

Scale (1,000+ users):
→ AI cost covered by revenue
→ 1,000 users × 30 emails = 900,000/month
→ Cost = ~$90/month only
```

---

## Database Schema

```
users
├── id
├── name
├── email
├── plan (free/pro/business)
├── gmail_token
└── created_at

clients
├── id
├── user_id
├── name
├── email
├── phone
├── company
└── address

emails
├── id
├── user_id
├── client_id
├── subject
├── body
├── status (draft/scheduled/sent)
├── scheduled_at
├── sent_at
└── ai_detected_type

documents
├── id
├── user_id
├── filename
├── extracted_text
└── uploaded_at

agent_message_logs
├── id
├── user_id
└── created_at
  (used for free-tier rate limiting: max 10 messages per 24 hours)
```

---

## Pricing Plans

### Free Plan
- 10 emails/month
- 3 clients
- Basic AI email generation
- Gmail connect
- Alex AI agent (10 messages/day)

### Pro — Rs. 999/month ($9.99/month)
- Unlimited emails
- Unlimited clients
- PDF upload & AI detection
- Schedule feature
- Full email history
- Tone adjustment
- Alex AI agent (unlimited, Gemini 2.5 Flash)

### Business — Rs. 2,499/month ($19.99/month)
- Everything in Pro
- Team members (up to 5)
- Priority support
- Advanced analytics
- Custom email signature
- Alex AI agent (unlimited, Gemini 2.5 Flash)

---

## Revenue Projection

```
Month 1:      10 users × Rs. 999 = Rs.    9,990
Month 3:      50 users × Rs. 999 = Rs.   49,950
Month 6:     200 users × Rs. 999 = Rs.  1,99,800
Month 9:     500 users × Rs. 999 = Rs.  4,99,500
Month 12:  1,000 users × Rs. 999 = Rs.  9,99,000
```

## Cost Breakdown at 1,000 Users

```
Vercel Pro:        $20/month
Supabase Pro:      $25/month
Email Service:     $20/month
Domain:             $2/month
AI (Gemini Flash): $90/month
───────────────────────────
Total Cost:       $157/month
                Rs.  44,000

Revenue:       Rs. 9,99,000
Cost:          Rs.    44,000
───────────────────────────
NET PROFIT:    Rs. 9,55,000/month 🔥
```

---

## Target Market

- Pakistani & Indian freelancers (Upwork, Fiverr)
- Small agencies & consultants
- Photographers, designers, developers
- Shop owners & small businesses

```
Pakistan alone:
Fiverr sellers:    500,000+
Upwork sellers:    200,000+
Total freelancers: 1,000,000+

1,000 users = only 0.1% of market ✅
```

---

## Launch Strategy

### Phase 1 — Build (Week 1–4)
```
Week 1–2: Core Features
  ✅ Auth (signup/login)
  ✅ Gmail OAuth connect
  ✅ Client management
  ✅ Basic email compose & send

Week 3: AI Integration
  ✅ OpenRouter API setup
  ✅ Nemotron 3 Super (free)
  ✅ PDF upload & text extraction
  ✅ AI email generation
  ✅ Tone selection

Week 4: Polish & Deploy
  ✅ Dashboard & analytics
  ✅ Schedule feature
  ✅ Deploy on Vercel
  ✅ Connect custom domain
```

### Phase 2 — Beta (Month 2)
```
✅ Give free access to 10 trusted contacts
✅ Collect real feedback
✅ Fix bugs
✅ Improve UI
```

### Phase 3 — Public Launch (Month 3)
```
✅ Post on Facebook & LinkedIn
✅ Share in freelancer groups
✅ Record a short demo video (Reels/TikTok)
✅ Launch referral program
```

### Phase 4 — Growth (Month 4+)
```
✅ Start writing blog posts
✅ Target SEO keywords
✅ Word of mouth
✅ Paid ads (once revenue is stable)
```

---

## Blog & SEO Strategy

### Target Keywords
```
"freelancer invoice email pakistan"
"how to send payment reminder to client"
"how to write professional email"
"invoice template pakistan"
"fiverr payment collection guide"
```

### Article Schedule
```
1–2 articles per week
3–4 months consistently
        ↓
Month 3–4: 50–100 visitors/day
Month 6+:  500–1,000 visitors/day
           10–20 signups/day 🎯
```

---

## Competitive Advantage

| Feature | MailMind AI | Others |
|---|---|---|
| Emails sent from YOUR Gmail | ✅ | ❌ |
| PDF auto-detection | ✅ | ❌ |
| AI tone adjustment | ✅ | ❌ |
| South Asia focused | ✅ | ❌ |
| PKR pricing | ✅ | ❌ |
| Free tier available | ✅ | Limited |

---

## Design Philosophy

```
1. Simple  — One task, one click
2. Fast    — Zero loading delays
3. Trust   — Professional look & feel
4. Luxury  — Premium UI that attracts users
```

---

*Built for South Asian freelancers & businesses.*
*Simple. Fast. AI-Powered.*
