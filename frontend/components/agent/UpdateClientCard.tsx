"use client";

interface UpdateClientCardProps {
  client: { name: string; email: string; company: string | null; phone: string | null };
  updates: { name?: string; email?: string; company?: string; phone?: string };
  onConfirm: (confirmed: boolean) => void;
  isLoading: boolean;
}

const FIELD_LABELS: Record<string, string> = {
  name: "Name", email: "Email", company: "Company", phone: "Phone",
};

export default function UpdateClientCard({ client, updates, onConfirm, isLoading }: UpdateClientCardProps) {
  const current: Record<string, string> = {
    name:    client.name,
    email:   client.email,
    company: client.company ?? "—",
    phone:   client.phone   ?? "—",
  };

  return (
    <div className="rounded-xl border border-slate-600 bg-slate-800 p-4 space-y-3">
      <p className="text-sm font-semibold text-slate-100">Update Client</p>
      <div className="space-y-2">
        {Object.entries(updates).map(([field, newVal]) => (
          <div key={field} className="text-xs space-y-0.5">
            <p className="text-slate-500 font-medium">{FIELD_LABELS[field] ?? field}</p>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 line-through">{current[field]}</span>
              <span className="text-cyan-400 font-medium">{newVal}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onConfirm(true)}
          disabled={isLoading}
          className="flex-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium py-2 transition-colors"
        >
          {isLoading ? "Updating…" : "Confirm Update"}
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
