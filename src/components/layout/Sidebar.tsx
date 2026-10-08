import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { navGroups } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function Sidebar({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const [userName, setUserName] = useState("Dr. K. Ramesh");
  const [userEmail, setUserEmail] = useState("farmer@procrop.in");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = window.localStorage.getItem("procrop.name");
      const storedEmail = window.localStorage.getItem("procrop.email");
      if (storedName) setUserName(storedName);
      if (storedEmail) setUserEmail(storedEmail);
    }
  }, []);

  const initials =
    userName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "KR";
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
              Cotton Jassid Intelligence
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

      <div className="shrink-0 border-t border-border/60 p-4">
        <Link
          to="/settings/profile"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-2xl border border-border/80 bg-background/50 px-3 py-2.5 transition-colors hover:bg-muted"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-semibold text-primary">
            {initials}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{userName}</span>
            <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
          </span>
        </Link>
      </div>
    </aside>
  );
}
