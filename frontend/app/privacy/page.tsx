import Link from "next/link";
import type { Metadata } from "next";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "Privacy Policy — MailMind AI",
  description: "How MailMind AI collects, uses, and protects your personal data.",
};

const BG   = "#0A0A0F";
const SURF = "#111118";
const BORD = "#1E1E2A";
const TXT  = "#F8F8FF";
const SEC  = "#9CA3AF";
const ACC  = "#6366F1";

const UPDATED = "June 30, 2026";

const sections = [
  {
    title: "1. Information We Collect",
    body: [
      "**Account data:** When you register, we collect your name, email address, and password (stored as a secure hash via Supabase Auth).",
      "**Gmail access:** When you connect your Gmail account, we request permission only to send emails on your behalf (scope: `gmail.send`). We do not read, store, or index your inbox or any existing emails.",
      "**Client data:** Names, email addresses, company names, and phone numbers you add to your client list are stored in our database and used solely to fulfil your email-sending requests.",
      "**Usage data:** We collect basic request logs (timestamps, endpoints, error codes) for debugging and security purposes. No message content is logged.",
    ],
  },
  {
    title: "2. How We Use Your Information",
    body: [
      "To authenticate you and maintain your session.",
      "To send emails from your Gmail account on your behalf when you instruct us to.",
      "To deliver scheduled emails at the times you choose.",
      "To generate PDF activity reports you request.",
      "To send you transactional emails (OTP codes, password resets) via our support mailer.",
      "We do not sell, rent, or share your personal data with third parties for advertising or marketing.",
    ],
  },
  {
    title: "3. Gmail Data & Google API Services",
    body: [
      "MailMind AI's use of information received from Google APIs adheres to the **Google API Services User Data Policy**, including the Limited Use requirements.",
      "We request only the `https://www.googleapis.com/auth/gmail.send` scope — the minimum permission needed to send emails on your behalf.",
      "We do not use your Gmail data to serve advertisements.",
      "We do not allow humans to read your Gmail data unless you explicitly share it with us for support purposes.",
      "Your Gmail OAuth tokens are encrypted at rest using AES-256-GCM and stored only in our secure database. They are never written to logs or shared with any third party.",
      "You can revoke Gmail access at any time from your account settings or from your Google Account at myaccount.google.com/permissions.",
    ],
  },
  {
    title: "4. Data Storage & Security",
    body: [
      "All data is stored on Supabase (PostgreSQL), hosted on AWS infrastructure with encryption at rest and in transit (TLS 1.2+).",
      "Gmail OAuth tokens are additionally encrypted at the application layer with AES-256-GCM before being written to the database.",
      "Passwords are never stored in plaintext — Supabase Auth handles hashing using bcrypt.",
      "Access to production data is restricted to authorised personnel only.",
    ],
  },
  {
    title: "5. Data Retention",
    body: [
      "Your account and client data are retained for as long as your account is active.",
      "Sent email records are retained for 30 days and then automatically deleted.",
      "If you delete your account, all associated data (clients, emails, Gmail tokens) is permanently deleted within 7 days.",
    ],
  },
  {
    title: "6. Third-Party Services",
    body: [
      "**Supabase** — database, authentication, and storage (supabase.com/privacy).",
      "**Google Gmail API** — used only to send emails on your behalf.",
      "**OpenRouter / Google Gemini** — AI model API used to generate email drafts. Only the email type, tone, and your instructions are sent — no client PII is included in AI prompts.",
      "**Vercel** — application hosting (vercel.com/legal/privacy-policy).",
    ],
  },
  {
    title: "7. Cookies & Local Storage",
    body: [
      "We use browser localStorage to store your theme preference, sidebar state, and agent chat sessions. No tracking cookies are used.",
      "Supabase Auth uses a secure HTTP-only cookie for your session token.",
    ],
  },
  {
    title: "8. Your Rights",
    body: [
      "You may request a copy of all personal data we hold about you.",
      "You may request correction or deletion of your data at any time.",
      "You may revoke Gmail access without deleting your account.",
      "To exercise these rights, email us at mailmindspt@gmail.com.",
    ],
  },
  {
    title: "9. Children's Privacy",
    body: [
      "MailMind AI is not directed at children under 13. We do not knowingly collect personal information from children.",
    ],
  },
  {
    title: "10. Changes to This Policy",
    body: [
      "We may update this policy from time to time. When we do, we will update the 'Last updated' date at the top of this page. Continued use of the service after changes constitutes acceptance of the updated policy.",
    ],
  },
  {
    title: "11. Contact",
    body: [
      "If you have questions about this Privacy Policy or how we handle your data, please contact us at **mailmindspt@gmail.com**.",
    ],
  },
];

function renderText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} style={{ color: TXT }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i} style={{ background: "#1e1e2a", color: "#a5b4fc", padding: "1px 5px", borderRadius: 4, fontSize: "0.85em" }}>{part.slice(1, -1)}</code>;
    return part;
  });
}

export default function PrivacyPage() {
  return (
    <div style={{ background: BG, color: TXT, minHeight: "100vh" }}>
      <MarketingNav />

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "80px 24px 100px" }}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{
            display: "inline-block",
            background: "#1e1e2a",
            border: `1px solid ${BORD}`,
            borderRadius: 99,
            padding: "4px 14px",
            fontSize: 11,
            color: ACC,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 20,
          }}>
            Legal
          </div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 800, margin: "0 0 12px", lineHeight: 1.15 }}>
            Privacy Policy
          </h1>
          <p style={{ color: SEC, fontSize: 14, margin: 0 }}>
            Last updated: {UPDATED}
          </p>
        </div>

        {/* Intro */}
        <div style={{
          background: SURF,
          border: `1px solid ${BORD}`,
          borderRadius: 16,
          padding: "24px 28px",
          marginBottom: 40,
          fontSize: 14,
          color: SEC,
          lineHeight: 1.75,
        }}>
          MailMind AI (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to protecting your privacy.
          This policy explains what information we collect, how we use it, and the choices you have.
          By using MailMind AI, you agree to the practices described here.
        </div>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
          {sections.map((section) => (
            <section key={section.title}>
              <h2 style={{
                fontSize: 17,
                fontWeight: 700,
                color: TXT,
                margin: "0 0 14px",
                paddingBottom: 10,
                borderBottom: `1px solid ${BORD}`,
              }}>
                {section.title}
              </h2>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {section.body.map((item, i) => (
                  <li key={i} style={{ display: "flex", gap: 10, fontSize: 14, color: SEC, lineHeight: 1.75 }}>
                    <span style={{ color: ACC, marginTop: 4, flexShrink: 0 }}>—</span>
                    <span>{renderText(item)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Footer CTA */}
        <div style={{
          marginTop: 60,
          padding: "28px",
          background: SURF,
          border: `1px solid ${BORD}`,
          borderRadius: 16,
          textAlign: "center",
        }}>
          <p style={{ color: SEC, fontSize: 13, margin: "0 0 16px" }}>
            Questions about your data or this policy?
          </p>
          <a
            href="mailto:mailmindspt@gmail.com"
            style={{
              display: "inline-block",
              background: ACC,
              color: "#fff",
              padding: "10px 24px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Contact Us
          </a>
          <p style={{ color: "#374151", fontSize: 12, margin: "20px 0 0" }}>
            <Link href="/" style={{ color: "#4B5563", textDecoration: "none" }}>Home</Link>
            {" · "}
            <Link href="/about" style={{ color: "#4B5563", textDecoration: "none" }}>About</Link>
            {" · "}
            <Link href="/contact" style={{ color: "#4B5563", textDecoration: "none" }}>Contact</Link>
          </p>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
