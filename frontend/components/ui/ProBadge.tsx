import type { Plan } from "@/types";

const CONFIGS = {
  pro: {
    label:  "PRO",
    bg:     "rgba(79,70,229,0.18)",
    color:  "var(--a-text)",
    border: "rgba(99,102,241,0.45)",
  },
  business: {
    label:  "BUSINESS",
    bg:     "rgba(124,58,237,0.18)",
    color:  "#a78bfa",
    border: "rgba(124,58,237,0.45)",
  },
} as const;

const SIZES = {
  sm: "px-2 py-0.5 text-[10px] gap-1",
  md: "px-3 py-1 text-xs gap-1.5",
  lg: "px-4 py-1.5 text-sm gap-2",
};

export default function ProBadge({
  plan,
  size = "sm",
}: {
  plan: Plan;
  size?: "sm" | "md" | "lg";
}) {
  if (plan === "free") return null;

  const c = CONFIGS[plan];
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold animate-badge-glow ${SIZES[size]}`}
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      ⚡ {c.label}
    </span>
  );
}
