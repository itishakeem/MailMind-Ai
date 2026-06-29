"use client";

interface Props {
  title: string;
  value: number | string;
  subtitle?: string;
  loading?: boolean;
  icon: React.ReactNode;
  color: string;   // tailwind from-* to-* e.g. "from-violet-500 to-purple-600"
  delta?: { value: number; label: string };
}

export default function AdminStatCard({ title, value, subtitle, loading, icon, color, delta }: Props) {
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden animate-fade-in-up"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${color} text-white flex-shrink-0`}
        >
          {icon}
        </div>
        {delta !== undefined && (
          <span
            className="text-xs font-bold px-2 py-1 rounded-lg"
            style={
              delta.value >= 0
                ? { background: "rgba(16,185,129,0.1)", color: "#059669" }
                : { background: "rgba(239,68,68,0.1)", color: "#dc2626" }
            }
          >
            {delta.value >= 0 ? "+" : ""}{delta.value} {delta.label}
          </span>
        )}
      </div>

      {loading ? (
        <>
          <div className="h-7 w-24 rounded-lg animate-pulse mb-1" style={{ background: "rgba(0,0,0,0.07)" }} />
          <div className="h-3 w-32 rounded animate-pulse" style={{ background: "rgba(0,0,0,0.04)" }} />
        </>
      ) : (
        <>
          <p className="text-2xl font-extrabold text-gray-900" style={{ color: "var(--text-1)" }}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-2)" }}>{title}</p>
          {subtitle && (
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>{subtitle}</p>
          )}
        </>
      )}
    </div>
  );
}
