import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";

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
        "flex flex-col rounded-2xl border border-border bg-surface shadow-soft transition-shadow hover:shadow-lg",
        className,
      )}
    >
      {title ? (
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
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
      <div className={cn("flex flex-1 flex-col p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
