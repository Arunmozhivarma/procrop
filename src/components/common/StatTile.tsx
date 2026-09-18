import { Link } from "@tanstack/react-router";
import { Icon } from "@/components/Icon";
import { RiskBadge } from "./RiskBadge";
import type { RiskLevel } from "@/types/common";

export function StatTile({
  icon,
  label,
  value,
  unit,
  hint,
  level,
  to,
}: {
  icon: string;
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  level?: RiskLevel;
  to?: string;
}) {
  const body = (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon name={icon} className="text-[20px]" />
        </span>
        {level ? <RiskBadge level={level} size="sm" /> : null}
      </div>
      <div className="mt-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 font-display text-2xl font-semibold">
          {value}
          {unit ? <span className="ml-1 text-base text-muted-foreground">{unit}</span> : null}
        </p>
        {hint ? <p className="mt-1 text-xs text-foreground/60">{hint}</p> : null}
      </div>
    </div>
  );
  return to ? (
    <Link to={to} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}
