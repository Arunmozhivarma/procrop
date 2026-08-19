import { Link } from "@tanstack/react-router";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

export const navGroups = [
  {
    label: "Monitor",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: "space_dashboard" },
      { to: "/overview", label: "Field map", icon: "map" },
      { to: "/farms", label: "Farms & fields", icon: "agriculture" },
      { to: "/crops", label: "Crops", icon: "potted_plant" },
    ],
  },
  {
    label: "Sense",
    items: [
      { to: "/soil", label: "Soil", icon: "landslide" },
      { to: "/environment", label: "Environment", icon: "cloud" },
      { to: "/devices", label: "IoT devices", icon: "sensors" },
    ],
  },
  {
    label: "Predict & explain",
    items: [
      { to: "/risk", label: "Risk engine", icon: "readiness_score" },
      { to: "/images", label: "Image analysis", icon: "document_scanner" },
      { to: "/explain", label: "Explainability", icon: "psychology" },
    ],
  },
  {
    label: "Act",
    items: [
      { to: "/recommendations", label: "Recommendations", icon: "checklist" },
      { to: "/alerts", label: "Alerts", icon: "notifications" },
      { to: "/analytics", label: "Analytics", icon: "monitoring" },
      { to: "/reports", label: "Reports", icon: "description" },
    ],
  },
  {
    label: "Manage",
    items: [
      { to: "/settings/profile", label: "Settings", icon: "settings" },
      { to: "/help", label: "Help", icon: "help" },
    ],
  },
] as const;

export function Sidebar({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  return (
    <aside
      className={cn(
        "flex w-[264px] shrink-0 flex-col border-r border-border bg-surface",
        className,
      )}
    >
      <div className="flex items-center gap-3 px-6 py-6">
        <Link to="/" className="flex items-center gap-3" onClick={onNavigate}>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
            <Icon name="eco" filled />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-xl font-semibold leading-tight">ProCrop</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              Agri Intelligence
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-6">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted"
                  activeProps={{ className: "bg-primary/10 text-primary" }}
                >
                  <Icon name={item.icon} className="text-[20px]" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <Link
        to="/settings/profile"
        onClick={onNavigate}
        className="m-4 flex items-center gap-3 rounded-2xl border border-border px-3 py-3 transition-colors hover:bg-muted"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-vitality/20 font-display text-sm font-semibold text-primary">
          UV
        </span>
        <span className="flex flex-col">
          <span className="text-sm font-medium">Uma Vardhan</span>
          <span className="text-xs text-muted-foreground">Farm manager</span>
        </span>
      </Link>
    </aside>
  );
}
