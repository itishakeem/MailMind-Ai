"use client";

import type { DailyEmailCount } from "@/types";

interface Props {
  data: DailyEmailCount[];
}

export default function EmailActivityChart({ data }: Props) {
  if (!data.length) return null;

  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((s, d) => s + d.count, 0);
  const today = new Date().toISOString().slice(0, 10);

  const W = 560;
  const H = 160;
  const BAR_W = 52;
  const GAP = (W - data.length * BAR_W) / (data.length + 1);
  const MAX_BAR_H = 110;
  const BASELINE = H - 28;

  return (
    <div
      className="rounded-2xl p-6 animate-fade-in-up"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">Email Activity</h2>
          <p className="text-xs text-gray-400 mt-0.5">Emails sent — last 7 days</p>
        </div>
        <div
          className="text-xs font-bold px-3 py-1.5 rounded-xl"
          style={{ background: "rgba(99,102,241,0.08)", color: "var(--a-to)" }}
        >
          {total} total
        </div>
      </div>

      {/* Chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ overflow: "visible", display: "block" }}
        aria-label="Email activity bar chart"
      >
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="barGradToday" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="barGradEmpty" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,0,0,0.06)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.04)" />
          </linearGradient>
        </defs>

        {/* Baseline */}
        <line
          x1={0} y1={BASELINE} x2={W} y2={BASELINE}
          stroke="rgba(0,0,0,0.07)" strokeWidth={1}
        />

        {/* Gridlines at 25%, 50%, 75% */}
        {[0.25, 0.5, 0.75].map((pct) => {
          const y = BASELINE - MAX_BAR_H * pct;
          return (
            <line
              key={pct}
              x1={0} y1={y} x2={W} y2={y}
              stroke="rgba(0,0,0,0.04)" strokeWidth={1} strokeDasharray="4 4"
            />
          );
        })}

        {data.map((d, i) => {
          const x = GAP + i * (BAR_W + GAP);
          const barH = d.count === 0 ? 4 : Math.max(8, (d.count / max) * MAX_BAR_H);
          const barY = BASELINE - barH;
          const isToday = d.date === today;
          const fill = d.count === 0
            ? "url(#barGradEmpty)"
            : isToday
            ? "url(#barGradToday)"
            : "url(#barGrad)";

          return (
            <g key={d.date}>
              {/* Bar */}
              <rect
                x={x}
                y={barY}
                width={BAR_W}
                height={barH}
                rx={6}
                ry={6}
                fill={fill}
                style={{ transition: "height 0.6s cubic-bezier(0.22,1,0.36,1), y 0.6s cubic-bezier(0.22,1,0.36,1)" }}
              />

              {/* Count label above bar */}
              {d.count > 0 && (
                <text
                  x={x + BAR_W / 2}
                  y={barY - 6}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={700}
                  fill={isToday ? "#6366f1" : "#374151"}
                >
                  {d.count}
                </text>
              )}

              {/* Day label below baseline */}
              <text
                x={x + BAR_W / 2}
                y={BASELINE + 18}
                textAnchor="middle"
                fontSize={11}
                fontWeight={isToday ? 700 : 500}
                fill={isToday ? "#6366f1" : "#9ca3af"}
              >
                {isToday ? "Today" : d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Empty state */}
      {total === 0 && (
        <p className="text-center text-xs text-gray-400 -mt-2">
          No emails sent in the last 7 days. Compose one to get started.
        </p>
      )}
    </div>
  );
}
