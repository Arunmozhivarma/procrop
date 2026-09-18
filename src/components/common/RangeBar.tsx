import { cn } from "@/lib/utils";

export function RangeBar({
  value,
  ideal,
  range,
  unit,
}: {
  value: number;
  ideal: [number, number];
  range: [number, number];
  unit?: string;
}) {
  const span = range[1] - range[0] || 1;
  const pct = (v: number) => ((v - range[0]) / span) * 100;
  const inBand = value >= ideal[0] && value <= ideal[1];
  return (
    <div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 rounded-full bg-risk-low/30"
          style={{ left: `${pct(ideal[0])}%`, width: `${pct(ideal[1]) - pct(ideal[0])}%` }}
        />
        <div
          className={cn(
            "absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface",
            inBand ? "bg-risk-low" : "bg-risk-high",
          )}
          style={{ left: `${Math.min(100, Math.max(0, pct(value)))}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
        <span>
          {range[0]}
          {unit}
        </span>
        <span>
          Optimal {ideal[0]}–{ideal[1]}
          {unit}
        </span>
        <span>
          {range[1]}
          {unit}
        </span>
      </div>
    </div>
  );
}
