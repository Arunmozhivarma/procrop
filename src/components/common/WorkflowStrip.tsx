import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";

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
