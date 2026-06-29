"use client";

import { useState } from "react";
import type { ContactSubmission } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function MessageModal({ contact, onClose }: { contact: ContactSubmission; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 animate-fade-in"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-bold" style={{ color: "var(--text-1)" }}>{contact.subject}</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
              {contact.name} · {contact.email} · {formatDate(contact.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: "var(--text-3)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.05)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div
          className="rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap"
          style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}
        >
          {contact.message}
        </div>
        <a
          href={`mailto:${contact.email}?subject=Re: ${encodeURIComponent(contact.subject)}`}
          className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
          style={{ background: "var(--a-gradient)", boxShadow: "0 4px 14px rgba(79,70,229,0.35)" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Reply via Email
        </a>
      </div>
    </div>
  );
}

export default function ContactsTable({ contacts }: { contacts: ContactSubmission[] }) {
  const [selected, setSelected] = useState<ContactSubmission | null>(null);

  if (contacts.length === 0) {
    return (
      <div className="py-16 text-center" style={{ color: "var(--text-3)" }}>
        <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-sm">No contact submissions yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Date", "Name", "Email", "Subject", "Message", ""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contacts.map(c => (
              <tr
                key={c.id}
                className="transition-colors cursor-pointer"
                style={{ borderBottom: "1px solid var(--border)" }}
                onClick={() => setSelected(c)}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.02)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "var(--text-3)" }}>
                  {formatDate(c.created_at)}
                </td>
                <td className="px-4 py-3 font-medium whitespace-nowrap" style={{ color: "var(--text-1)" }}>{c.name}</td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--text-3)" }}>{c.email}</td>
                <td className="px-4 py-3 max-w-xs">
                  <p className="font-medium truncate" style={{ color: "var(--text-1)" }}>{c.subject}</p>
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <p className="text-xs truncate" style={{ color: "var(--text-2)" }}>{c.message}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium" style={{ color: "var(--a-to)" }}>View →</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <MessageModal contact={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
