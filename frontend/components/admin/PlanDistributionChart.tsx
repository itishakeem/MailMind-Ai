"use client";

interface Props {
  data: { free: number; pro: number; business: number };
}

const SLICES = [
  { key: "free",     label: "Free",     color: "#6366f1" },
  { key: "pro",      label: "Pro",      color: "#8b5cf6" },
  { key: "business", label: "Business", color: "#f59e0b" },
] as const;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSlicePath(cx: number, cy: number, r: number, inner: number, startAngle: number, endAngle: number) {
  const s = polarToCartesian(cx, cy, r, startAngle);
  const e = polarToCartesian(cx, cy, r, endAngle);
  const si = polarToCartesian(cx, cy, inner, startAngle);
  const ei = polarToCartesian(cx, cy, inner, endAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${s.x} ${s.y}`,
    `A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`,
    `L ${ei.x} ${ei.y}`,
    `A ${inner} ${inner} 0 ${large} 0 ${si.x} ${si.y}`,
    "Z",
  ].join(" ");
}

export default function PlanDistributionChart({ data }: Props) {
  const total = data.free + data.pro + data.business;

  if (total === 0) {
    return (
      <div className="rounded-2xl p-6" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
        <h3 className="text-base font-bold mb-4" style={{ color: "var(--text-1)" }}>Plan Distribution</h3>
        <p className="text-sm text-center py-8" style={{ color: "var(--text-3)" }}>No users yet</p>
      </div>
    );
  }

  const cx = 80; const cy = 80; const r = 70; const inner = 45;
  let current = 0;
  const slices = SLICES.map(s => {
    const count = data[s.key];
    const pct   = count / total;
    const deg   = pct * 360;
    const path  = deg > 0.5 ? donutSlicePath(cx, cy, r, inner, current, current + deg - 0.5) : null;
    current += deg;
    return { ...s, count, pct, path };
  });

  return (
    <div className="rounded-2xl p-6 animate-fade-in-up" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
      <h3 className="text-base font-bold mb-4" style={{ color: "var(--text-1)" }}>Plan Distribution</h3>
      <div className="flex items-center gap-6">
        <svg width={160} height={160} viewBox="0 0 160 160" className="flex-shrink-0">
          {slices.map(s => s.path && (
            <path key={s.key} d={s.path} fill={s.color} opacity={0.9} />
          ))}
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize={20} fontWeight={800} fill="var(--text-1)">{total.toLocaleString()}</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize={10} fill="var(--text-3)">users</text>
        </svg>
        <div className="flex-1 space-y-3">
          {slices.map(s => (
            <div key={s.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <span className="text-sm font-medium" style={{ color: "var(--text-2)" }}>{s.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: "var(--text-1)" }}>{s.count.toLocaleString()}</span>
                <span className="text-xs" style={{ color: "var(--text-3)" }}>{(s.pct * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
