import Link from "next/link";
import type { Metadata } from "next";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "Terms & Conditions — MailMind AI",
  description: "Terms and conditions governing your use of MailMind AI.",
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
    title: "1. Acceptance of Terms",
    body: [
      "By accessing or using MailMind AI (\"Service\"), you agree to be bound by these Terms & Conditions (\"Terms\"). If you do not agree, do not use the Service.",
      "These Terms apply to all visitors, users, and others who access or use the Service.",
      "We reserve the right to update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the revised Terms.",
    ],
  },
  {
    title: "2. Description of Service",
    body: [
      "MailMind AI is an AI-powered email assistant that helps freelancers and small businesses compose and send professional emails through their own Gmail accounts.",
      "The Service includes AI email generation, Gmail OAuth integration, client management, scheduled email delivery, and PDF document processing.",
      "The Service is provided on an \"as is\" and \"as available\" basis. We make no guarantees about uptime, availability, or uninterrupted access.",
    ],
  },
  {
    title: "3. Account Registration",
    body: [
      "You must register for an account to use the Service. You agree to provide accurate, current, and complete information during registration.",
      "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.",
      "You must notify us immediately at mailmindspt@gmail.com if you suspect unauthorised access to your account.",
      "You must be at least 13 years old to use the Service. By registering, you represent that you meet this requirement.",
    ],
  },
  {
    title: "4. Gmail Integration",
    body: [
      "To send emails through the Service, you must connect your Google Gmail account via OAuth 2.0. By doing so, you grant MailMind AI limited permission to send emails on your behalf using the `gmail.send` scope only.",
      "We will never read, store, index, or process your existing Gmail inbox or any emails you did not explicitly compose through our Service.",
      "You can revoke Gmail access at any time from your account settings or from your Google Account at myaccount.google.com/permissions.",
      "You are solely responsible for all emails sent from your Gmail account through the Service, including their content, recipients, and timing.",
    ],
  },
  {
    title: "5. Acceptable Use",
    body: [
      "You agree not to use the Service to send spam, unsolicited bulk email, phishing messages, or any content that violates applicable laws.",
      "You agree not to use the Service to harass, threaten, or harm any individual or organisation.",
      "You agree not to attempt to gain unauthorised access to the Service, its servers, or any connected systems.",
      "You agree not to reverse-engineer, decompile, or disassemble any part of the Service.",
      "You agree not to use the Service in any way that could damage, disable, overburden, or impair it.",
      "Violation of these acceptable use rules may result in immediate account suspension or termination without notice.",
    ],
  },
  {
    title: "6. Subscription Plans & Payments",
    body: [
      "**Free Plan:** Provides 15 emails per day and up to 5 clients at no cost. Free plans may be modified or discontinued at our discretion with reasonable notice.",
      "**Pro Plan ($9.99/month):** Provides unlimited emails, unlimited clients, and access to all premium features. Billed monthly via Lemon Squeezy.",
      "**Business Plan ($19.99/month):** Coming soon. Multi-seat plan with team features. Subject to separate terms upon launch.",
      "All payments are processed securely by Lemon Squeezy. MailMind AI does not store your payment card details.",
      "Subscriptions auto-renew monthly unless cancelled. You may cancel at any time from your account settings or by contacting us.",
      "No refunds are issued for partial billing periods, except where required by applicable law.",
    ],
  },
  {
    title: "7. Intellectual Property",
    body: [
      "The Service, including its design, code, AI models, and branding, is owned by MailMind AI and protected by applicable intellectual property laws.",
      "You retain ownership of all content you input into the Service (client details, instructions, uploaded PDFs).",
      "AI-generated email drafts produced by the Service are provided to you for your use. You are responsible for reviewing and approving all content before sending.",
      "You grant MailMind AI a limited, non-exclusive licence to process your inputs solely for the purpose of providing the Service to you.",
    ],
  },
  {
    title: "8. Disclaimers",
    body: [
      "The Service is provided \"as is\" without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.",
      "AI-generated email content may contain errors, inaccuracies, or inappropriate suggestions. You are solely responsible for reviewing all generated content before sending.",
      "We do not guarantee that the Service will be free from errors, viruses, or other harmful components.",
      "We are not responsible for the actions of email recipients or the deliverability of emails sent through Gmail.",
    ],
  },
  {
    title: "9. Limitation of Liability",
    body: [
      "To the maximum extent permitted by law, MailMind AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.",
      "Our total liability to you for any claim arising from the Service shall not exceed the amount you paid to us in the 3 months preceding the claim.",
      "This limitation applies regardless of the theory of liability (contract, tort, negligence, or otherwise) and even if we have been advised of the possibility of such damages.",
    ],
  },
  {
    title: "10. Indemnification",
    body: [
      "You agree to indemnify, defend, and hold harmless MailMind AI, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, costs, or expenses (including legal fees) arising from:",
      "Your use of the Service in violation of these Terms.",
      "Emails you send through the Service and any consequences thereof.",
      "Your violation of any third-party rights, including intellectual property or privacy rights.",
    ],
  },
  {
    title: "11. Termination",
    body: [
      "You may terminate your account at any time by deleting it from your account settings. Upon deletion, all your data (clients, emails, Gmail tokens) will be permanently removed within 7 days.",
      "We may suspend or terminate your account immediately if you violate these Terms, engage in fraudulent activity, or if required by law.",
      "Upon termination, your right to use the Service ceases immediately. Provisions that by their nature should survive termination (including liability limitations and disclaimers) shall survive.",
    ],
  },
  {
    title: "12. Governing Law",
    body: [
      "These Terms shall be governed by and construed in accordance with applicable laws. Any disputes shall be resolved through good-faith negotiation first.",
      "If negotiation fails, disputes shall be submitted to binding arbitration or the courts of competent jurisdiction.",
    ],
  },
  {
    title: "13. Contact",
    body: [
      "If you have questions about these Terms, please contact us at **mailmindspt@gmail.com**.",
      "For urgent account issues, please include your account email in your message.",
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

export default function TermsPage() {
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
            Terms &amp; Conditions
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
          Please read these Terms &amp; Conditions carefully before using MailMind AI. These Terms govern your access to and
          use of our Service. By creating an account or using MailMind AI in any way, you agree to be bound by these Terms.
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
            Questions about these Terms?
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
            <Link href="/privacy" style={{ color: "#4B5563", textDecoration: "none" }}>Privacy Policy</Link>
            {" · "}
            <Link href="/contact" style={{ color: "#4B5563", textDecoration: "none" }}>Contact</Link>
          </p>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
