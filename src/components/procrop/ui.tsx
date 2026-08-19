import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";
import { riskMeta, type RiskLevel } from "@/lib/procrop-data";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-foreground/70">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  icon,
  action,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  subtitle?: string;
  icon?: string;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-surface shadow-soft transition-shadow hover:shadow-lg",
        className,
      )}
    >
      {title ? (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
          <div className="flex items-center gap-3">
            {icon ? (
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon name={icon} className="text-[20px]" />
              </span>
            ) : null}
            <div>
              <h2 className="font-display text-base font-semibold leading-tight">{title}</h2>
              {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
            </div>
          </div>
          {action}
        </header>
      ) : null}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

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
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
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
        <span className="font-display text-4xl font-semibold leading-none">{Math.round(value)}</span>
        {label ? <span className="mt-1 text-xs text-muted-foreground">{label}</span> : null}
        {sublabel ? (
          <span className={cn("mt-1 text-xs font-semibold", riskMeta[level].text)}>{sublabel}</span>
        ) : null}
      </div>
    </div>
  );
}

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
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
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

export function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-foreground/70 hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

export function EmptyState({
  icon = "inbox",
  title,
  body,
  action,
}: {
  icon?: string;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon name={icon} className="text-[26px]" />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      {body ? <p className="mt-1 max-w-sm text-sm text-foreground/60">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function LoadingBlock({ label = "Loading data…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-surface px-6 py-12 text-sm text-muted-foreground">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      {label}
    </div>
  );
}

export function ButtonLink({
  to,
  children,
  variant = "primary",
  icon,
}: {
  to: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  icon?: string;
}) {
  return (
    <Link to={to} className={buttonClass(variant)}>
      {icon ? <Icon name={icon} className="text-[18px]" /> : null}
      {children}
    </Link>
  );
}

export function buttonClass(variant: "primary" | "ghost" = "primary") {
  return cn(
    "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:bg-primary/90"
      : "border border-border bg-surface text-foreground hover:bg-muted",
  );
}

export function DataRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export function WorkflowStrip({ current }: { current: string }) {
  const stages = ["Collect", "Monitor", "Predict", "Image", "Explain", "Recommend", "Alert"];
  return (
    <div className="mb-6 flex flex-wrap items-center gap-1.5 rounded-2xl border border-border bg-surface px-4 py-3 text-xs">
      {stages.map((s, i) => (
        <span key={s} className="flex items-center gap-1.5">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 font-semibold",
              s === current ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {s}
          </span>
          {i < stages.length - 1 ? (
            <Icon name="chevron_right" className="text-[14px] text-muted-foreground/60" />
          ) : null}
        </span>
      ))}
    </div>
  );
}
