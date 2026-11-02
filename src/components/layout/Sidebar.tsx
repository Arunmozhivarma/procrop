import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { navGroups } from "@/config/navigation";
import { cn } from "@/lib/utils";
import {
  getAllAccounts,
  getActiveAccount,
  setActiveAccountId,
  removeAccount,
  logoutUser,
  fetchLatestPrediction,
  ACTIVE_ACCOUNT_UPDATED_EVENT,
  type StoredAccount,
} from "@/services/api";

export function Sidebar({
  onNavigate,
  className,
  collapsed = false,
  onToggle,
}: {
  onNavigate?: () => void;
  className?: string;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const [activeAccount, setActiveAccountState] = useState<StoredAccount | null>(null);
  const [allAccounts, setAllAccountsState] = useState<StoredAccount[]>([]);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [latestRisk, setLatestRisk] = useState<{
    risk_class: string;
    field_name: string | undefined;
    prediction_id?: number;
  } | null>(null);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncAccounts = () => {
      setActiveAccountState(getActiveAccount());
      setAllAccountsState(getAllAccounts());
    };
    syncAccounts();
    window.addEventListener(ACTIVE_ACCOUNT_UPDATED_EVENT, syncAccounts);
    return () => window.removeEventListener(ACTIVE_ACCOUNT_UPDATED_EVENT, syncAccounts);
  }, []);

  // Load latest risk chip
  useEffect(() => {
    const acc = getActiveAccount();
    if (!acc) return;
    fetchLatestPrediction()
      .then((pred) => {
        if (pred) {
          setLatestRisk({
            risk_class: pred.risk_class,
            field_name: pred.field_name,
            prediction_id: pred.prediction_id,
          });
        }
      })
      .catch(() => null);
  }, []);

  // Close switcher on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSwitch = (acc: StoredAccount) => {
    setActiveAccountId(acc.id);
    setSwitcherOpen(false);
    // Force page reload to reset all state
    window.location.href = "/dashboard";
  };

  const handleSignOut = async () => {
    setSwitcherOpen(false);
    await logoutUser();
    const remaining = getAllAccounts();
    setAllAccountsState(remaining);
    setActiveAccountState(remaining[0] ?? null);
    window.location.href = "/auth";
  };

  const handleRemove = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    removeAccount(id);
    const remaining = getAllAccounts();
    setAllAccountsState(remaining);
    if (activeAccount?.id === id) {
      if (remaining.length > 0 && remaining[0]) {
        setActiveAccountId(remaining[0].id);
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/auth";
      }
    }
  };

  const displayName = activeAccount?.name ?? "ProCrop User";
  const displayEmail = activeAccount?.email ?? "";
  const displayRole = activeAccount?.role ?? "Farmer";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "PC";

  function riskChipStyle(risk: string) {
    if (risk === "High") return "border-risk-high/40 bg-risk-high/15 text-risk-high";
    if (risk === "Medium") return "border-risk-moderate/40 bg-risk-moderate/15 text-risk-moderate";
    return "border-risk-low/40 bg-risk-low/15 text-risk-low";
  }
  function riskChipIcon(risk: string) {
    if (risk === "High") return "warning";
    if (risk === "Medium") return "trending_up";
    return "check_circle";
  }

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-border bg-surface",
        collapsed ? "w-[76px]" : "w-[264px]",
        className,
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex py-6",
          collapsed ? "flex-col items-center gap-2 px-3" : "items-center justify-between px-5",
        )}
      >
        <Link
          to="/"
          className={cn("flex min-w-0 items-center", collapsed ? "justify-center" : "gap-3")}
          onClick={onNavigate}
          aria-label="ProCrop home"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
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
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              "rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Icon name={collapsed ? "menu_open" : "menu"} />
          </button>
        )}
      </div>

      {/* Latest Risk Chip */}
      {latestRisk && (
        <div className={cn("pb-3", collapsed ? "px-3" : "px-4")}>
          <Link
            to="/recommendations"
            search={
              latestRisk.prediction_id
                ? { id: String(latestRisk.prediction_id) }
                : { id: undefined }
            }
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-xl border py-2 text-xs font-semibold transition-colors hover:opacity-80",
              collapsed ? "justify-center px-2" : "px-3",
              riskChipStyle(latestRisk.risk_class),
            )}
            aria-label={`Latest risk: ${latestRisk.risk_class}${latestRisk.field_name ? `, ${latestRisk.field_name}` : ""}`}
            title={collapsed ? `Latest risk: ${latestRisk.risk_class}` : undefined}
          >
            <Icon name={riskChipIcon(latestRisk.risk_class)} className="text-[14px] shrink-0" />
            {!collapsed && (
              <span className="truncate">
                Latest Risk: <strong>{latestRisk.risk_class}</strong>
                {latestRisk.field_name ? ` · ${latestRisk.field_name}` : ""}
              </span>
            )}
            {!collapsed && <Icon name="arrow_forward" className="text-[12px] shrink-0 ml-auto" />}
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav
        className={cn("flex-1 overflow-y-auto pb-6", collapsed ? "px-3" : "px-4")}
        aria-label="Main navigation"
      >
        {navGroups.map((group) => (
          <div key={group.label} className={cn("mb-5", collapsed && "flex flex-col items-center")}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {group.label}
              </p>
            )}
            <div className="flex w-full flex-col gap-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center rounded-xl py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted",
                    collapsed ? "justify-center px-2" : "gap-3 px-3",
                  )}
                  activeProps={{ className: "bg-primary/10 text-primary" }}
                  aria-label={collapsed ? item.label : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon name={item.icon} className="text-[20px]" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Account Switcher Footer */}
      <div
        ref={switcherRef}
        className={cn("relative shrink-0 border-t border-border/60", collapsed ? "p-3" : "p-4")}
      >
        {/* Account Switcher Popover */}
        {switcherOpen && (
          <div
            className={cn(
              "absolute z-50 mb-2 overflow-hidden rounded-2xl border border-border bg-surface shadow-lg",
              collapsed ? "bottom-0 left-full ml-2 w-[260px]" : "bottom-full left-4 right-4",
            )}
          >
            <div className="px-4 py-3 border-b border-border/60">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Signed-in Accounts
              </p>
            </div>

            <div className="max-h-48 overflow-y-auto">
              {allAccounts.map((acc) => {
                const isActive = acc.id === activeAccount?.id;
                const accInitials =
                  acc.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((s) => s[0]?.toUpperCase())
                    .join("") || "PC";
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => !isActive && handleSwitch(acc)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                      isActive ? "bg-primary/10 cursor-default" : "hover:bg-muted cursor-pointer",
                    )}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-xs font-semibold text-primary">
                      {accInitials}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-xs font-semibold text-foreground">
                        {acc.name}
                        {isActive && (
                          <span className="ml-1.5 text-[10px] text-primary font-bold">
                            ✓ Active
                          </span>
                        )}
                      </span>
                      <span className="truncate text-[10px] text-muted-foreground">
                        {acc.email}
                      </span>
                    </span>
                    {!isActive && (
                      <button
                        type="button"
                        onClick={(e) => handleRemove(e, acc.id)}
                        className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                        title="Remove account"
                      >
                        <Icon name="close" className="text-[14px]" />
                      </button>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-border/60 p-2 space-y-1">
              <Link
                to="/auth"
                onClick={() => setSwitcherOpen(false)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
              >
                <Icon name="person_add" className="text-[16px]" />
                Add another account
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Icon name="logout" className="text-[16px]" />
                Sign out
              </button>
            </div>
          </div>
        )}

        {/* Active Account Button */}
        <button
          type="button"
          onClick={() => setSwitcherOpen((o) => !o)}
          className={cn(
            "flex w-full items-center rounded-2xl border border-border/80 bg-background/50 py-2.5 text-left transition-colors hover:bg-muted",
            collapsed ? "justify-center px-1" : "gap-3 px-3",
          )}
          aria-label={collapsed ? `Account menu for ${displayName}` : undefined}
          title={collapsed ? displayName : undefined}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-semibold text-primary">
            {initials}
          </span>
          {!collapsed && (
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-foreground">{displayName}</span>
              <span className="truncate text-xs text-muted-foreground">
                {displayRole} · {displayEmail || "Not signed in"}
              </span>
            </span>
          )}
          {!collapsed && (
            <Icon
              name={switcherOpen ? "expand_more" : "unfold_more"}
              className="text-[18px] text-muted-foreground shrink-0"
            />
          )}
        </button>
      </div>
    </aside>
  );
}
