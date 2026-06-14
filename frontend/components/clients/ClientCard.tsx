"use client";

import Link from "next/link";
import type { Client } from "@/types";

interface ClientCardProps {
  client: Client & { email_count?: number; last_sent_at?: string | null };
  onDeleted: (id: string) => void;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ClientCard({ client, onDeleted }: ClientCardProps) {
  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${client.name}"? This cannot be undone.`)) return;

    const res = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
    if (res.ok) {
      onDeleted(client.id);
    } else {
      alert("Failed to delete client. Please try again.");
    }
  }

  return (
    <Link
      href={`/clients/${client.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        {/* Avatar initials */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{client.name}</p>
            <p className="text-xs text-gray-500 truncate">{client.email}</p>
            {client.company && (
              <p className="text-xs text-gray-400 truncate">{client.company}</p>
            )}
          </div>
        </div>

        {/* Email count badge */}
        <span className="shrink-0 text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
          {client.email_count ?? 0} email{(client.email_count ?? 0) !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-gray-400">
          Last email: {formatDate(client.last_sent_at)}
        </p>
        <button
          onClick={handleDelete}
          className="text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 hover:bg-red-50 rounded"
          title="Delete client"
        >
          Delete
        </button>
      </div>
    </Link>
  );
}
