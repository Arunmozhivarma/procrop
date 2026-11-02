import { Link } from "@tanstack/react-router";
import { Icon } from "@/components/Icon";
import { navGroups } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/services/queries";

export function Sidebar({
  onNavigate,
  className,
  collapsed = false,
}: {
  onNavigate?: () => void;
  className?: string;
  collapsed?: boolean;
}) {
  // The account chip shows the signed-in row of the users table, or a sign-in link.
  const { user, isSignedIn, isLoading } = useCurrentUser();

  const initials = (user?.name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-border bg-surface transition-all duration-300",
        collapsed ? "w-16" : "w-[264px]",
        className,
      )}
    >
      <div className={cn("flex items-center px-6 py-6", collapsed ? "justify-center px-4" : "")}>
        <Link to="/" className="flex items-center gap-3" onClick={onNavigate}>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft shrink-0">
            <Icon name="eco" filled />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-display text-xl font-semibold leading-tight">ProCrop</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                Cotton Jassid Intelligence
              </span>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-6">
        {navGroups.map((group) => (
          <div key={group.label} className={cn("mb-5", collapsed ? "mb-2" : "")}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {group.label}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted",
                    collapsed ? "justify-center px-2" : "",
                  )}
                  activeProps={{ className: "bg-primary/10 text-primary" }}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon name={item.icon} className="text-[20px] shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-border/60 p-4">
        <Link
          to={isSignedIn ? "/settings/profile" : "/auth"}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-2xl border border-border/80 bg-background/50 px-3 py-2.5 transition-colors hover:bg-muted",
            collapsed ? "justify-center px-2" : "",
          )}
          title={collapsed ? (user ? user.name : "Account") : undefined}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-semibold text-primary">
            {initials || <Icon name="person" className="text-[20px]" />}
          </span>
          {!collapsed && (
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">
                {user
                  ? user.name
                  : isLoading
                    ? "Loading account…"
                    : isSignedIn
                      ? "Account unavailable"
                      : "Sign in"}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {user ? user.email : isSignedIn ? "" : "Not signed in"}
              </span>
            </span>
          )}
        </Link>
      </div>
    </aside>
  );
}
