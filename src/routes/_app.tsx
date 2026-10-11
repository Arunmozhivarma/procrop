import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const [mobileNav, setMobileNav] = useState(false);

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
        {/* Mobile Header (Menu toggle on small screens; top bar removed on desktop) */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            className="rounded-xl p-2 hover:bg-muted"
            onClick={() => setMobileNav(true)}
            aria-label="Open navigation"
          >
            <Icon name="menu" />
          </button>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
              <Icon name="eco" filled className="text-sm" />
            </span>
            <span className="font-display font-semibold text-sm">ProCrop</span>
          </div>
          <div className="w-8" />
        </header>

        <div className={cn("min-w-0 flex-1")}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
