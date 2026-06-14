"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ClientForm from "@/components/clients/ClientForm";
import ClientHistory from "@/components/clients/ClientHistory";
import type { Client, Email } from "@/types";

type EmailHistoryItem = Pick<
  Email,
  "id" | "subject" | "ai_detected_type" | "status" | "sent_at" | "created_at"
>;

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "16px",
  border: "1px solid rgba(0,0,0,0.06)",
  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
};

const gradientBtn: React.CSSProperties = {
  background: "linear-gradient(135deg,#2563eb,#4f46e5)",
  boxShadow: "0 4px 14px rgba(79,70,229,0.3)",
};

export default function ClientDetailPage() {
  const params  = useParams<{ id: string }>();
  const router  = useRouter();
  const [client,   setClient]   = useState<Client | null>(null);
  const [emails,   setEmails]   = useState<EmailHistoryItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/clients/${params.id}`)
      .then(async r => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return; }
        const d = await r.json();
        setClient(d.client);
        setEmails(d.emails ?? []);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [params?.id]);

  function handleUpdated(updated: Client) {
    setClient(updated);
    setEditMode(false);
  }

  async function handleDelete() {
    if (!client) return;
    if (!confirm(`Delete "${client.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
    if (res.ok) router.push("/clients");
    else alert("Delete failed. Please try again.");
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-64 bg-gray-50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (notFound || !client) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="font-medium">Client not found.</p>
        <Link href="/clients" className="mt-3 inline-block text-sm" style={{ color: "#4f46e5" }}>
          Back to Clients
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-5 animate-fade-in-up">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/clients" className="hover:text-gray-600 transition-colors">Clients</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{client.name}</span>
      </nav>

      {/* Client Card */}
      <div style={cardStyle} className="p-6">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0"
              style={{ background: "linear-gradient(135deg,#2563eb,#4f46e5)" }}
            >
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">{client.name}</h1>
              <p className="text-sm text-gray-500">{client.email}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/compose?clientId=${client.id}`}
              className="px-3 py-1.5 text-sm font-bold text-white rounded-lg transition-all hover:-translate-y-0.5"
              style={gradientBtn}
            >
              Compose Email
            </Link>
            <button
              onClick={() => setEditMode(!editMode)}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {editMode ? "Cancel" : "Edit"}
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
              style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.05)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              Delete
            </button>
          </div>
        </div>

        {editMode ? (
          <ClientForm client={client} onSuccess={handleUpdated} onCancel={() => setEditMode(false)} />
        ) : (
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: "Email",   value: client.email },
              { label: "Phone",   value: client.phone   ?? "—" },
              { label: "Company", value: client.company ?? "—" },
              { label: "Address", value: client.address ?? "—" },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</dt>
                <dd className="mt-1 text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* Email History */}
      <div style={cardStyle} className="p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">
          Email History
          {emails.length > 0 && (
            <span className="ml-2 text-xs font-normal text-gray-400">
              ({emails.length} email{emails.length !== 1 ? "s" : ""})
            </span>
          )}
        </h2>
        <ClientHistory emails={emails} />
      </div>
    </div>
  );
}
