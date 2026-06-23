"use client";

interface ConfirmActionCardProps {
  title: string;
  description: string;
  details: { label: string; value: string }[];
  confirmLabel?: string;
  confirmVariant?: "danger" | "primary";
  loadingLabel?: string;
  onConfirm: (confirmed: boolean) => void;
  isLoading: boolean;
}

export default function ConfirmActionCard({
  title,
  description,
  details,
  confirmLabel   = "Confirm",
  confirmVariant = "danger",
  loadingLabel   = "Working…",
  onConfirm,
  isLoading,
}: ConfirmActionCardProps) {
  const confirmCls = confirmVariant === "danger"
    ? "bg-red-600 hover:bg-red-500"
    : "bg-indigo-600 hover:bg-indigo-500";

  return (
    <div className="rounded-xl border border-slate-600 bg-slate-800 p-3 space-y-2.5">
      <p className="text-xs font-semibold text-slate-100">{title}</p>
      <p className="text-[11px] text-slate-400 leading-relaxed">{description}</p>
      <div className="space-y-1">
        {details.map((d) => (
          <div key={d.label} className="flex gap-2 text-[11px]">
            <span className="text-slate-500 w-14 flex-shrink-0">{d.label}:</span>
            <span className="text-slate-300 break-all">{d.value}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-0.5">
        <button
          onClick={() => onConfirm(true)}
          disabled={isLoading}
          className={`flex-1 rounded-lg ${confirmCls} disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium py-1.5 transition-colors`}
        >
          {isLoading ? loadingLabel : confirmLabel}
        </button>
        <button
          onClick={() => onConfirm(false)}
          disabled={isLoading}
          className="flex-1 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 text-xs font-medium py-1.5 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
