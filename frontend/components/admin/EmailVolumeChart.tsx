"use client";

interface DataPoint {
  date: string;
  label: string;
  sent: number;
  failed: number;
}

interface Props {
  data: DataPoint[];
  title?: string;
  subtitle?: string;
}

export default function EmailVolumeChart({ data, title = "Email Volume", subtitle = "Last 30 days — sent & failed" }: Props) {
  if (!data.length) return null;

  const maxVal  = Math.max(...data.map(d => d.sent + d.failed), 1);
  const totalSent   = data.reduce((s, d) => s + d.sent, 0);
  const totalFailed = data.reduce((s, d) => s + d.failed, 0);

  const W = 580; const H = 160;
  const STEP   = W / data.length;
  const BAR_W  = Math.max(4, STEP * 0.65);
  const MAX_H  = 110;
  const BASE_Y = H - 28;

  // Show every 5th label to avoid crowding
  const showLabel = (i: number) => i % 5 === 0 || i === data.length - 1;

  return (
    <div className="rounded-2xl p-6 animate-fade-in-up" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-base font-bold" style={{ color: "var(--text-1)" }}>{title}</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{subtitle}</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#6366f1" }} />
            <span style={{ color: "var(--text-2)" }}>Sent <strong style={{ color: "var(--text-1)" }}>{totalSent}</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#ef4444" }} />
            <span style={{ color: "var(--text-2)" }}>Failed <strong style={{ color: "var(--text-1)" }}>{totalFailed}</strong></span>
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: "visible", display: "block" }}>
        <defs>
          <linearGradient id="adminSentGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="adminFailGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>

        <line x1={0} y1={BASE_Y} x2={W} y2={BASE_Y} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
        {[0.25, 0.5, 0.75].map(p => (
          <line key={p} x1={0} y1={BASE_Y - MAX_H * p} x2={W} y2={BASE_Y - MAX_H * p}
            stroke="rgba(0,0,0,0.04)" strokeWidth={1} strokeDasharray="4 4" />
        ))}

        {data.map((d, i) => {
          const cx     = i * STEP + STEP / 2;
          const x      = cx - BAR_W / 2;
          const sentH  = d.sent  > 0 ? Math.max(3, (d.sent  / maxVal) * MAX_H) : 0;
          const failH  = d.failed > 0 ? Math.max(3, (d.failed / maxVal) * MAX_H) : 0;
          const total  = sentH + failH;

          return (
            <g key={d.date}>
              {sentH > 0 && (
                <rect x={x} y={BASE_Y - total} width={BAR_W} height={sentH} rx={3} fill="url(#adminSentGrad)" />
              )}
              {failH > 0 && (
                <rect x={x} y={BASE_Y - failH} width={BAR_W} height={failH} rx={3} fill="url(#adminFailGrad)" />
              )}
              {showLabel(i) && (
                <text x={cx} y={BASE_Y + 16} textAnchor="middle" fontSize={9} fill="var(--text-3)" fontWeight={500}>
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
