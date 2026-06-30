import type { EmailType } from "@/types";

interface TypeTheme {
  label: string;
  icon: string;
  gradientFrom: string;
  gradientTo: string;
  accent: string;
  badgeBg: string;
  badgeColor: string;
}

const THEMES: Record<string, TypeTheme> = {
  invoice: {
    label: "Invoice",
    icon: "💳",
    gradientFrom: "#1e40af",
    gradientTo: "#2563eb",
    accent: "#1d4ed8",
    badgeBg: "#dbeafe",
    badgeColor: "#1e40af",
  },
  payment_reminder: {
    label: "Payment Reminder",
    icon: "⏰",
    gradientFrom: "#92400e",
    gradientTo: "#d97706",
    accent: "#b45309",
    badgeBg: "#fef3c7",
    badgeColor: "#92400e",
  },
  project_update: {
    label: "Project Update",
    icon: "📋",
    gradientFrom: "#065f46",
    gradientTo: "#059669",
    accent: "#047857",
    badgeBg: "#d1fae5",
    badgeColor: "#065f46",
  },
  proposal: {
    label: "Proposal",
    icon: "✨",
    gradientFrom: "#4c1d95",
    gradientTo: "#7c3aed",
    accent: "#6d28d9",
    badgeBg: "#ede9fe",
    badgeColor: "#4c1d95",
  },
  manual: {
    label: "Message",
    icon: "✉️",
    gradientFrom: "#1f2937",
    gradientTo: "#374151",
    accent: "#374151",
    badgeBg: "#f3f4f6",
    badgeColor: "#374151",
  },
};

function escapeAndFormat(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>");
}

function bodyToHtml(text: string): string {
  const blocks = text.trim().split(/\n{2,}/);

  return blocks
    .map((block) => {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      if (!lines.length) return "";

      const allBullets = lines.every((l) => /^[-•*]\s/.test(l));
      if (allBullets) {
        const items = lines
          .map((l) => l.replace(/^[-•*]\s+/, ""))
          .map((l) => `<li style="margin-bottom:6px;color:#374151;font-size:15px;line-height:1.6;">${escapeAndFormat(l)}</li>`)
          .join("");
        return `<ul style="margin:0 0 18px 0;padding-left:22px;">${items}</ul>`;
      }

      const allNumbered = lines.every((l, i) => new RegExp(`^${i + 1}[.)\\s]`).test(l));
      if (allNumbered && lines.length > 1) {
        const items = lines
          .map((l) => l.replace(/^\d+[.)]\s*/, ""))
          .map((l) => `<li style="margin-bottom:6px;color:#374151;font-size:15px;line-height:1.6;">${escapeAndFormat(l)}</li>`)
          .join("");
        return `<ol style="margin:0 0 18px 0;padding-left:22px;">${items}</ol>`;
      }

      const content = lines
        .map((line) => {
          if (/^[-•*]\s/.test(line)) {
            return `&bull; ${escapeAndFormat(line.replace(/^[-•*]\s+/, ""))}`;
          }
          return escapeAndFormat(line);
        })
        .join("<br>");

      return `<p style="margin:0 0 18px 0;color:#374151;font-size:15px;line-height:1.75;">${content}</p>`;
    })
    .join("");
}

export function renderEmailHtml(
  emailType: EmailType | null | undefined,
  body: string
): string {
  const theme = THEMES[emailType ?? "manual"] ?? THEMES.manual;
  const bodyHtml = bodyToHtml(body);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;">
  <tr>
    <td align="center" style="padding:36px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Colorful header -->
        <tr>
          <td style="background:linear-gradient(135deg,${theme.gradientFrom},${theme.gradientTo});padding:36px 36px 32px;text-align:center;">
            <div style="font-size:44px;line-height:1;margin-bottom:14px;">${theme.icon}</div>
            <span style="display:inline-block;background:rgba(255,255,255,0.18);color:#ffffff;font-size:11px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;padding:6px 20px;border-radius:99px;border:1px solid rgba(255,255,255,0.3);">${theme.label}</span>
          </td>
        </tr>

        <!-- Divider bar -->
        <tr>
          <td style="background:linear-gradient(90deg,${theme.gradientFrom},${theme.gradientTo});height:3px;font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 36px 28px;">
            ${bodyHtml}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:18px 36px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              Sent via <strong style="color:${theme.accent};">MailMind AI</strong>
              &nbsp;·&nbsp;
              <a href="https://mailmindai.xyz" style="color:${theme.accent};text-decoration:none;">mailmindai.xyz</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
