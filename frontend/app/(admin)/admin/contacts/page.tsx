"use client";

import { useEffect, useState } from "react";
import ContactsTable from "@/components/admin/ContactsTable";
import type { ContactSubmission } from "@/types";

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);

  const perPage = 25;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/contacts?page=${page}`)
      .then(r => r.json())
      .then(d => { setContacts(d.contacts ?? []); setTotal(d.total ?? 0); setLoading(false); })
      .catch(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-extrabold" style={{ color: "var(--text-1)" }}>Contact Messages</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
          {total > 0 ? `${total.toLocaleString()} message${total !== 1 ? "s" : ""} received` : "Messages submitted via the contact form"}
        </p>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden animate-fade-in-up"
        style={{ animationDelay: "60ms", background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-48 rounded animate-pulse" style={{ background: "rgba(0,0,0,0.07)" }} />
                <div className="h-3 w-full max-w-sm rounded animate-pulse" style={{ background: "rgba(0,0,0,0.04)" }} />
              </div>
            ))}
          </div>
        ) : (
          <ContactsTable contacts={contacts} />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-2)" }}
            >
              ← Prev
            </button>
            <span className="text-xs font-medium" style={{ color: "var(--text-2)" }}>{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-2)" }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
