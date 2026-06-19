"use client";

import { useEffect, useState } from "react";
import type { EmailTemplate } from "@/types";

interface TemplatePickerProps {
  onSelect: (template: EmailTemplate) => void;
  onSave: (name: string) => Promise<void>;
  canSave: boolean;
}

export default function TemplatePicker({ onSelect, onSave, canSave }: TemplatePickerProps) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [view, setView] = useState<"list" | "save">("list");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/templates");
    if (res.ok) {
      const data = await res.json();
      setTemplates(data);
    }
    setLoading(false);
  }

  function handleOpen() {
    setOpen(true);
    setView("list");
    setError(null);
    load();
  }

  async function handleSave() {
    if (!newName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(newName.trim());
      await load();
      setNewName("");
      setView("list");
    } catch (e) {
      setError((e as Error).message ?? "Failed to save template.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    setTemplates(prev => prev.filter(t => t.id !== id));
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
        style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)", color: "#4f46e5" }}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10" />
        </svg>
        Templates
      </button>
    );
  }

  return (
    <div
      className="rounded-xl border overflow-hidden animate-fade-in"
      style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 text-sm font-bold text-gray-900"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center gap-2">
          {view === "save" && (
            <button onClick={() => setView("list")} className="text-gray-400 hover:text-gray-600 mr-1">←</button>
          )}
          {view === "list" ? "Your Templates" : "Save as Template"}
        </div>
        <div className="flex items-center gap-2">
          {view === "list" && canSave && (
            <button
              onClick={() => { setView("save"); setError(null); }}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
              style={{ background: "rgba(99,102,241,0.08)", color: "#4f46e5" }}
            >
              + Save current
            </button>
          )}
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {view === "save" ? (
          <div className="space-y-3">
            <label className="block text-xs font-medium text-gray-700">Template name</label>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSave(); }}
              placeholder="e.g. Monthly Invoice Follow-up"
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={{ border: "1px solid rgba(0,0,0,0.12)", boxShadow: "0 0 0 0" }}
              autoFocus
              maxLength={100}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              onClick={handleSave}
              disabled={saving || !newName.trim()}
              className="w-full rounded-lg py-2 text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#2563eb,#4f46e5)" }}
            >
              {saving ? "Saving…" : "Save Template"}
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />)}
          </div>
        ) : templates.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            No templates saved yet.{canSave ? ' Click "+ Save current" to save this email as a template.' : ""}
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {templates.map(t => (
              <div
                key={t.id}
                onClick={() => { onSelect(t); setOpen(false); }}
                className="flex items-start justify-between gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 group"
                style={{ border: "1px solid rgba(0,0,0,0.06)" }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{t.name}</p>
                  <p className="text-xs text-gray-400 truncate">{t.subject}</p>
                </div>
                <button
                  onClick={e => handleDelete(t.id, e)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-600 transition-all px-1.5 py-0.5 rounded"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
