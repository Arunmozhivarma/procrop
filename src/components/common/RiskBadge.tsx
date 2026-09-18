import { riskMeta } from "@/data/common";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types/common";

export function RiskBadge({
  level,
  label,
  className,
  size = "md",
}: {
  level: RiskLevel;
  label?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const m = riskMeta[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border font-semibold",
        m.bg,
        m.text,
        m.border,
        size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {label ?? m.label}
    </span>
  );
}
