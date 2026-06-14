"use client";

import TypeBadge from "@/components/compose/TypeBadge";
import type { EmailType, Tone } from "@/types";

interface AIPreviewProps {
  detectedType: EmailType;
  subject: string;
  body: string;
  tone: Tone;
  fallbackMode: boolean;
  regenerating: boolean;
  onTypeChange: (type: EmailType) => void;
  onSubjectChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onRegenerate: () => void;
  onSendNow: () => void;
  onSchedule: (scheduledAt: string) => void;
  sending: boolean;
  scheduling: boolean;
}

export default function AIPreview({
  detectedType,
  subject,
  body,
  fallbackMode,
  regenerating,
  onTypeChange,
  onSubjectChange,
  onBodyChange,
  onRegenerate,
  onSendNow,
  onSchedule,
  sending,
  scheduling,
}: AIPreviewProps) {
  function handleScheduleClick() {
    const input = document.getElementById("schedule-datetime") as HTMLInputElement | null;
    const value = input?.value;
    if (!value) {
      alert("Please select a date and time.");
      return;
    }
    const selected = new Date(value);
    if (selected <= new Date(Date.now() + 60 * 1000)) {
      alert("Scheduled time must be at least 1 minute in the future.");
      return;
    }
    onSchedule(selected.toISOString());
  }

  // Minimum datetime for the picker = 2 minutes from now
  const minDateTime = new Date(Date.now() + 2 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  return (
    <div className="space-y-4">
      {/* Fallback mode banner */}
      {fallbackMode && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          <span className="shrink-0 text-lg">⚠️</span>
          <span>
            AI is temporarily unavailable — composing manually. Your email will still be sent from your Gmail.
          </span>
        </div>
      )}

      {/* Type badge (only in AI mode) */}
      {!fallbackMode && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Detected type:</span>
          <TypeBadge type={detectedType} onChange={onTypeChange} />
        </div>
      )}

      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Email subject…"
        />
      </div>

      {/* Body */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Body</label>
        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          rows={12}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono"
          placeholder="Email body…"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
        {/* Regenerate (only in AI mode) */}
        {!fallbackMode && (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={regenerating}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            {regenerating ? "Regenerating…" : "↺ Regenerate"}
          </button>
        )}

        <div className="flex-1" />

        {/* Schedule */}
        <div className="flex items-center gap-2">
          <input
            id="schedule-datetime"
            type="datetime-local"
            min={minDateTime}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleScheduleClick}
            disabled={scheduling || !subject.trim() || !body.trim()}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60 transition-colors whitespace-nowrap"
          >
            {scheduling ? "Scheduling…" : "Schedule"}
          </button>
        </div>

        {/* Send Now */}
        <button
          type="button"
          onClick={onSendNow}
          disabled={sending || !subject.trim() || !body.trim()}
          className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors whitespace-nowrap"
        >
          {sending ? "Sending…" : "Send Now →"}
        </button>
      </div>
    </div>
  );
}
