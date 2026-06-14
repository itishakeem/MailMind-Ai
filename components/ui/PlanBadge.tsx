import type { Plan } from "@/types";

interface PlanBadgeProps {
  plan: Plan;
  className?: string;
}

const COLORS: Record<Plan, string> = {
  free: "bg-gray-100 text-gray-600",
  pro: "bg-blue-100 text-blue-700",
  business: "bg-purple-100 text-purple-700",
};

export default function PlanBadge({ plan, className = "" }: PlanBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${COLORS[plan]} ${className}`}
    >
      {plan}
    </span>
  );
}
