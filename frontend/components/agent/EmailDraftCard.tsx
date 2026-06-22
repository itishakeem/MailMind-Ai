"use client";

interface EmailDraftCardProps {
  to: { name: string; email: string };
  subject: string;
  body: string;
  onConfirm: (confirmed: boolean) => void;
  isLoading: boolean;
}

export default function EmailDraftCard({
  to,
  subject,
  body,
  onConfirm,
  isLoading,
}: EmailDraftCardProps) {
  return (
    <div className="rounded-xl border border-slate-600 bg-slate-800 p-4 space-y-3">
      <p className="text-sm font-semibold text-slate-100">Email Draft</p>
      <div className="space-y-2">
        <div className="flex gap-2 text-xs">
          <span className="text-slate-500 w-14 flex-shrink-0">To:</span>
          <span className="text-slate-200">
            {to.name} &lt;{to.email}&gt;
          </span>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="text-slate-500 w-14 flex-shrink-0">Subject:</span>
          <span className="text-slate-200 font-medium">{subject}</span>
        </div>
        <div className="border-t border-slate-700 pt-2">
          <p className="text-xs text-slate-500 mb-1.5">Body:</p>
          <div className="text-xs text-slate-200 whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed scrollbar-thin scrollbar-thumb-slate-600">
            {body}
          </div>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onConfirm(true)}
          disabled={isLoading}
          className="flex-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium py-2 transition-colors"
        >
          {isLoading ? "Sending…" : "Send Email"}
        </button>
        <button
          onClick={() => onConfirm(false)}
          disabled={isLoading}
          className="flex-1 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 text-xs font-medium py-2 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
