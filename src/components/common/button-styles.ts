import { cn } from "@/lib/utils";

export function buttonClass(variant: "primary" | "ghost" = "primary") {
  return cn(
    "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:bg-primary/90"
      : "border border-border bg-surface text-foreground hover:bg-muted",
  );
}
