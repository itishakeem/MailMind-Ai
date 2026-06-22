"use client";

interface ConfirmActionCardProps {
  title: string;
  description: string;
  details: { label: string; value: string }[];
  onConfirm: (confirmed: boolean) => void;
  isLoading: boolean;
}

export default function ConfirmActionCard({
  title,
  description,
  details,
  onConfirm,
  isLoading,
}: ConfirmActionCardProps) {
  return (
    <div className="rounded-xl border border-slate-600 bg-slate-800 p-4 space-y-3">
      <p className="text-sm font-semibold text-slate-100">{title}</p>
      <p className="text-xs text-slate-400">{description}</p>
      <div className="space-y-1.5">
        {details.map((d) => (
          <div key={d.label} className="flex gap-2 text-xs">
            <span className="text-slate-500 w-16 flex-shrink-0">{d.label}:</span>
            <span className="text-slate-200 break-all">{d.value}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onConfirm(true)}
          disabled={isLoading}
          className="flex-1 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium py-2 transition-colors"
        >
          {isLoading ? "Removing…" : "Yes, Remove"}
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
