import type { EmailType, Tone } from "@/types";

const TYPE_LABELS: Record<EmailType, string> = {
  invoice: "Invoice",
  payment_reminder: "Payment Reminder",
  project_update: "Project Update",
  proposal: "Project Proposal",
  manual: "Email",
};

const TONE_DESCRIPTIONS: Record<Tone, string> = {
  friendly: "warm and approachable while staying professional",
  formal: "formal and professional, using proper business salutations",
  strict: "firm and direct, making requirements or urgency very clear",
};

// First-pass classification prompt — expects JSON { type, confidence }
export function buildDetectTypePrompt(text: string): string {
  return `You are an email type classifier for a South Asian freelancer tool.

Classify the following context into exactly one type:
- invoice: request payment for completed work
- payment_reminder: follow up on an overdue or upcoming payment
- project_update: share progress, completion, or status of a project
- proposal: pitch services or propose a new project to a client

Context:
"""
${text.slice(0, 2000)}
"""

Reply with JSON only, no explanation:
{"type":"invoice|payment_reminder|project_update|proposal","confidence":"high|medium|low"}`;
}

// Email generation prompt — expects JSON { subject, body }
export function buildGenerateEmailPrompt(
  text: string,
  type: EmailType,
  tone: Tone,
  clientName?: string
): string {
  const typeName = TYPE_LABELS[type] ?? "Email";
  const toneDesc = TONE_DESCRIPTIONS[tone] ?? tone;
  const greeting = clientName
    ? `Use "Dear ${clientName}," as the greeting`
    : 'Use "Dear [Client Name]," as the greeting';

  return `You are a professional email writer for a South Asian freelancer.

Write a ${typeName} email.
Tone: ${toneDesc}
${greeting}

Context:
"""
${text.slice(0, 3000)}
"""

Rules:
- Subject: concise, professional, under 80 characters
- Body: 3–4 short paragraphs; end with "Best regards,\\n[Your Name]"
- Do not invent financial figures or dates not present in the context
- If currency is mentioned use PKR / Rs. format
- Total body under 300 words

Reply with JSON only:
{"subject":"...","body":"..."}`;
}

// Monthly dashboard summary prompt — plain text response
export function buildMonthlySummaryPrompt(stats: {
  emailsSent: number;
  topClients: string[];
  commonType: string;
}): string {
  return `Write a 2–3 sentence monthly summary for a freelancer's email dashboard.

Data:
- Emails sent this month: ${stats.emailsSent}
- Most active clients: ${stats.topClients.slice(0, 3).join(", ") || "none yet"}
- Most common email type: ${stats.commonType || "general"}

Write in second person ("You sent…"). Be concise and encouraging. Under 60 words. Plain text only.`;
}
