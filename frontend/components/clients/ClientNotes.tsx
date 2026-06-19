"use client";

import { useEffect, useState } from "react";
import type { ClientNote } from "@/types";

interface ClientNotesProps {
  clientId: string;
  isPro: boolean;
}

export default function ClientNotes({ clientId, isPro }: ClientNotesProps) {
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPro) return;
    setLoading(true);
    fetch(`/api/clients/${clientId}/notes`)
      .then(r => r.json())
      .then(d => { setNotes(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [clientId, isPro]);

  async function handleAdd() {
    if (!noteText.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/clients/${clientId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: noteText.trim() }),
    });
    setSaving(false);
    if (res.ok) {
      const newNote = await res.json();
      setNotes(prev => [newNote, ...prev]);
      setNoteText("");
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to save note.");
    }
  }

  async function handleDelete(noteId: string) {
    if (!confirm("Delete this note?")) return;
    await fetch(`/api/clients/${clientId}/notes/${noteId}`, { method: "DELETE" });
    setNotes(prev => prev.filter(n => n.id !== noteId));
  }

  if (!isPro) {
    return (
      <div
        className="rounded-xl p-4 text-center text-sm"
        style={{ background: "rgba(99,102,241,0.04)", border: "1px dashed rgba(99,102,241,0.3)" }}
      >
        <p className="text-gray-500 mb-2">Client notes are a Pro feature.</p>
        <a
          href="/profile"
          className="inline-flex items-center gap-1 text-xs font-bold rounded-lg px-3 py-1.5 text-white"
          style={{ background: "linear-gradient(135deg,#2563eb,#4f46e5)" }}
        >
          ⚡ Upgrade to Pro
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add note input */}
      <div className="space-y-2">
        <textarea
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          placeholder="Add a private note about this client…"
          rows={3}
          maxLength={2000}
          className="w-full rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none transition-colors"
          style={{ border: "1px solid rgba(0,0,0,0.12)", boxShadow: "none" }}
          onFocus={e => { e.currentTarget.style.borderColor = "rgba(79,70,229,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,70,229,0.1)"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{noteText.length}/2000</span>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            onClick={handleAdd}
            disabled={saving || !noteText.trim()}
            className="px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-all hover:-translate-y-0.5 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#2563eb,#4f46e5)" }}
          >
            {saving ? "Saving…" : "Add Note"}
          </button>
        </div>
      </div>

      {/* Notes list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)}
        </div>
      ) : notes.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-3">No notes yet.</p>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div
              key={note.id}
              className="group flex items-start gap-3 p-3 rounded-xl"
              style={{ background: "rgba(249,250,251,1)", border: "1px solid rgba(0,0,0,0.06)" }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{note.body}</p>
                <p className="text-xs text-gray-400 mt-1.5">
                  {new Date(note.created_at).toLocaleDateString("en-PK", { dateStyle: "medium" })}
                  {" · "}
                  {new Date(note.created_at).toLocaleTimeString("en-PK", { timeStyle: "short" })}
                </p>
              </div>
              <button
                onClick={() => handleDelete(note.id)}
                className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-600 transition-all shrink-0 mt-0.5"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
