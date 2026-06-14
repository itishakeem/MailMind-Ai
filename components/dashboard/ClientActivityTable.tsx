import Link from "next/link";
import type { ClientActivity } from "@/types";

interface ClientActivityTableProps {
  activity: ClientActivity[];
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ClientActivityTable({ activity }: ClientActivityTableProps) {
  if (activity.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4 text-center">
        No email activity yet. Send your first email from the Compose page.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Client</th>
            <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Emails Sent</th>
            <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Last Email</th>
            <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {activity.map((row) => (
            <tr key={row.client_id ?? row.client_name} className="hover:bg-gray-50">
              <td className="py-3 pr-4">
                <p className="font-medium text-gray-900">{row.client_name}</p>
              </td>
              <td className="py-3 pr-4 text-gray-700">{row.email_count}</td>
              <td className="py-3 pr-4 text-gray-500 text-xs whitespace-nowrap">
                {formatDate(row.last_sent_at)}
              </td>
              <td className="py-3">
                {row.client_id ? (
                  <Link
                    href={`/compose?clientId=${row.client_id}`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Compose
                  </Link>
                ) : (
                  <span className="text-xs text-gray-300">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
