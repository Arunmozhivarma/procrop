import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Sidebar } from "@/components/layout/Sidebar";
import { alerts, farms } from "@/lib/procrop-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const [mobileNav, setMobileNav] = useState(false);
  const [farmId, setFarmId] = useState(farms[0]?.id ?? "");
  const unread = alerts.filter((a) => !a.read).length;
  const farm = farms.find((f) => f.id === farmId) ?? farms[0];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar className="sticky top-0 hidden h-screen lg:flex" />

      {mobileNav ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileNav(false)}
            aria-hidden="true"
          />
          <Sidebar className="relative z-10 h-full" onNavigate={() => setMobileNav(false)} />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur md:px-6">
          <button
            type="button"
            className="rounded-xl p-2 hover:bg-muted lg:hidden"
            onClick={() => setMobileNav(true)}
            aria-label="Open navigation"
          >
            <Icon name="menu" />
          </button>

          <label className="relative hidden min-w-0 flex-1 items-center md:flex">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 text-[18px] text-muted-foreground"
            />
            <input
              type="search"
              placeholder="Search SMW weeks, features, predictions…"
              className="w-full max-w-md rounded-xl border border-border bg-background py-2 pl-10 pr-3 text-sm outline-none transition-colors focus:border-primary"
            />
          </label>

          <div className="ml-auto flex items-center gap-2">
            <select
              value={farmId}
              onChange={(e) => setFarmId(e.target.value)}
              className="hidden rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary sm:block"
              aria-label="Select farm"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>

            <Link
              to="/alerts"
              className="relative rounded-xl p-2 transition-colors hover:bg-muted"
              aria-label="Alerts"
            >
              <Icon name="notifications" />
              {unread > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-critical px-1 text-[10px] font-bold text-primary-foreground">
                  {unread}
                </span>
              ) : null}
            </Link>

            <Link
              to="/recommendations"
              className="hidden items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:inline-flex"
            >
              <Icon name="edit_note" className="text-[18px]" />
              Log scouting data
            </Link>
          </div>
        </header>

        <div className={cn("min-w-0 flex-1")}>
          <p className="sr-only">{farm?.location}</p>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
