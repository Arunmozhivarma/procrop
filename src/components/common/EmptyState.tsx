import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";

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
