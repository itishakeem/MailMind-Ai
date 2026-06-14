import type { Email, EmailType, EmailStatus } from "@/types";

interface ClientHistoryProps {
  emails: Pick<Email, "id" | "subject" | "ai_detected_type" | "status" | "sent_at" | "created_at">[];
}

const TYPE_LABELS: Record<EmailType, string> = {
  invoice: "Invoice",
  payment_reminder: "Reminder",
  project_update: "Update",
  proposal: "Proposal",
  manual: "Manual",
};

const TYPE_COLORS: Record<EmailType, string> = {
  invoice: "bg-blue-100 text-blue-700",
  payment_reminder: "bg-orange-100 text-orange-700",
  project_update: "bg-green-100 text-green-700",
  proposal: "bg-purple-100 text-purple-700",
  manual: "bg-gray-100 text-gray-600",
};

const STATUS_COLORS: Record<EmailStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  scheduled: "bg-yellow-100 text-yellow-700",
  sent: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ClientHistory({ emails }: ClientHistoryProps) {
  if (emails.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <svg
          className="w-10 h-10 mx-auto mb-3 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <p className="text-sm">No emails sent yet.</p>
        <p className="text-xs mt-1">Use the Compose button to send your first email.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 pr-4 font-medium text-gray-500 text-xs uppercase tracking-wide">
              Subject
            </th>
            <th className="text-left py-2 pr-4 font-medium text-gray-500 text-xs uppercase tracking-wide">
              Type
            </th>
            <th className="text-left py-2 pr-4 font-medium text-gray-500 text-xs uppercase tracking-wide">
              Status
            </th>
            <th className="text-left py-2 font-medium text-gray-500 text-xs uppercase tracking-wide">
              Date
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {emails.map((email) => (
            <tr key={email.id} className="hover:bg-gray-50">
              <td className="py-3 pr-4 text-gray-900 max-w-xs truncate">
                {email.subject}
              </td>
              <td className="py-3 pr-4">
                {email.ai_detected_type ? (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      TYPE_COLORS[email.ai_detected_type]
                    }`}
                  >
                    {TYPE_LABELS[email.ai_detected_type]}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="py-3 pr-4">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    STATUS_COLORS[email.status]
                  }`}
                >
                  {email.status}
                </span>
              </td>
              <td className="py-3 text-gray-500 text-xs whitespace-nowrap">
                {formatDate(email.sent_at ?? email.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
