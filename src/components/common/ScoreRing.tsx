import { riskMeta } from "@/data/common";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types/common";

export function ScoreRing({
  value,
  size = 180,
  stroke = 14,
  label,
  sublabel,
  level,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  level: RiskLevel;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          stroke="var(--muted)"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={riskMeta[level].ring}
          strokeDasharray={`${dash} ${c - dash}`}
          className="transition-[stroke-dasharray] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-semibold leading-none">
          {Math.round(value)}
        </span>
        {label ? <span className="mt-1 text-xs text-muted-foreground">{label}</span> : null}
        {sublabel ? (
          <span className={cn("mt-1 text-xs font-semibold", riskMeta[level].text)}>{sublabel}</span>
        ) : null}
      </div>
    </div>
  );
}
