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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar - Always visible, collapsible */}
      <Sidebar
        className="sticky top-0 hidden h-screen lg:flex"
        collapsed={sidebarCollapsed}
        onNavigate={() => setMobileNav(false)}
      />

      {/* Mobile Sidebar - Overlay */}
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
        {/* Header with sidebar toggle */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur">
          <div className="flex items-center gap-2">
            {/* Desktop Sidebar Toggle */}
            <button
              type="button"
              className="hidden rounded-xl p-2 hover:bg-muted lg:block"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label="Toggle sidebar"
            >
              <Icon name={sidebarCollapsed ? "menu_open" : "menu"} />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="rounded-xl p-2 hover:bg-muted lg:hidden"
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
