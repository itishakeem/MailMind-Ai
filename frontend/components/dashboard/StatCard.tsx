import Skeleton from "@/components/ui/Skeleton";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  loading?: boolean;
  icon?: React.ReactNode;
  accentGradient?: string;
}

const DEFAULT_GRADIENT = "from-blue-500 to-indigo-600";

export default function StatCard({
  title,
  value,
  subtitle,
  loading,
  icon,
  accentGradient = DEFAULT_GRADIENT,
}: StatCardProps) {
  return (
    <div
      className="group relative rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
      onMouseEnter={e =>
        ((e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.15)")
      }
      onMouseLeave={e =>
        ((e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)")
      }
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${accentGradient}`} />

      <div className="px-5 py-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</p>
            {loading ? (
              <Skeleton className="mt-2 h-9 w-20" />
            ) : (
              <p className="mt-1.5 text-3xl font-extrabold text-gray-900 leading-none">{value}</p>
            )}
            {subtitle && !loading && (
              <p className="mt-1.5 text-xs text-gray-400">{subtitle}</p>
            )}
          </div>

          {/* Icon */}
          {icon && (
            <div
              className={`ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accentGradient} text-white shadow-sm transition-transform duration-200 group-hover:scale-110`}
            >
              {icon}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
