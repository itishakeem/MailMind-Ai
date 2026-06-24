import type { EmailType } from "@/types";

interface TypeTheme {
  label: string;
  accent: string;
  badgeBg: string;
}

const THEMES: Record<string, TypeTheme> = {
  invoice:          { label: "Invoice",          accent: "#1d4ed8", badgeBg: "#eff6ff" },
  payment_reminder: { label: "Payment Reminder", accent: "#b45309", badgeBg: "#fffbeb" },
  project_update:   { label: "Project Update",   accent: "#047857", badgeBg: "#ecfdf5" },
  proposal:         { label: "Proposal",         accent: "#6d28d9", badgeBg: "#f5f3ff" },
  manual:           { label: "Message",          accent: "#374151", badgeBg: "#f3f4f6" },
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

  // Only show type badge for non-manual emails
  const badgeHtml = emailType && emailType !== "manual"
    ? `<div style="margin-bottom:20px;">
        <span style="display:inline-block;background-color:${theme.badgeBg};color:${theme.accent};font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;padding:5px 14px;border-radius:99px;">${theme.label}</span>
       </div>`
    : "";

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
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;">

        <!-- Accent bar -->
        <tr>
          <td style="background-color:${theme.accent};height:5px;font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 36px 36px;">
            ${badgeHtml}${bodyHtml}
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
