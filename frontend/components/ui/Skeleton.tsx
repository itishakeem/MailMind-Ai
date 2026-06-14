interface SkeletonProps {
  variant?: "text" | "card" | "table-row";
  className?: string;
  lines?: number;
}

export default function Skeleton({
  variant = "text",
  className = "",
  lines = 1,
}: SkeletonProps) {
  if (variant === "card") {
    return (
      <div className={`bg-gray-100 rounded-xl animate-pulse ${className}`} style={{ minHeight: 120 }} />
    );
  }

  if (variant === "table-row") {
    return (
      <tr className="animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <td key={i} className="px-4 py-3">
            <div className="h-4 bg-gray-100 rounded w-3/4" />
          </td>
        ))}
      </tr>
    );
  }

  // text variant
  return (
    <div className={`space-y-2 animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-100 rounded"
          style={{ width: i === lines - 1 && lines > 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}
