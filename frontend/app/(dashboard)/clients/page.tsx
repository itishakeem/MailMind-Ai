"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import ClientCard from "@/components/clients/ClientCard";
import ClientForm from "@/components/clients/ClientForm";
import Skeleton from "@/components/ui/Skeleton";
import type { Client } from "@/types";

interface ClientWithStats extends Client {
  email_count: number;
  last_sent_at: string | null;
}

interface PlanLimitError {
  limit_type: string;
  current_count: number;
  max_allowed: number;
}

const gradientBtn: React.CSSProperties = {
  background: "linear-gradient(135deg,#2563eb,#4f46e5)",
  boxShadow: "0 4px 14px rgba(79,70,229,0.3)",
};

export default function ClientsPage() {
  const [clients, setClients]   = useState<ClientWithStats[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [planInfo, setPlanInfo] = useState<PlanLimitError | null>(null);
  const [isPro, setIsPro]       = useState(false);

  void setPlanInfo; // referenced via API responses only

  useEffect(() => {
    fetch("/api/clients")
      .then(r => r.json())
      .then(d => { setClients(d.clients ?? []); setLoading(false); })
      .catch(() => setLoading(false));
    fetch("/api/dashboard/stats")
      .then(r => r.json())
      .then(d => setIsPro(d.plan === "pro" || d.plan === "business"))
      .catch(() => {});
  }, []);

  function handleAdded(client: Client) {
    setClients(prev => [{ ...client, email_count: 0, last_sent_at: null }, ...prev]);
    setShowForm(false);
  }

  function handleDeleted(id: string) {
    setClients(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Clients</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your client contacts and view email history.</p>
        </div>
        <div className="flex items-center gap-3">
          {planInfo && (
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
              {planInfo.current_count} / {planInfo.max_allowed} clients
            </span>
          )}
          {isPro && (
            <a
              href="/api/export/clients"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all hover:-translate-y-0.5"
              style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)", color: "#059669" }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </a>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:-translate-y-0.5"
            style={gradientBtn}
          >
            + Add Client
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(n => <Skeleton key={n} variant="card" className="h-32" />)}
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "rgba(79,70,229,0.08)" }}>
              <Users className="h-7 w-7" style={{ color: "#4f46e5" }} />
            </div>
            <p className="text-sm font-semibold text-gray-600">No clients yet.</p>
            <p className="text-xs text-gray-400 mt-1">Add your first client to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map(c => (
              <ClientCard key={c.id} client={c} onDeleted={handleDeleted} />
            ))}
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl w-full max-w-md p-6"
            style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}
          >
            <h2 className="text-lg font-bold text-gray-900 mb-5">Add New Client</h2>
            <ClientForm onSuccess={handleAdded} onCancel={() => setShowForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
