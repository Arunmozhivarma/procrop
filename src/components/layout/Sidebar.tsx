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
  type StoredAccount,
} from "@/services/api";

export function Sidebar({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
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
    const acc = getActiveAccount();
    setActiveAccountState(acc);
    setAllAccountsState(getAllAccounts());
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
        "flex w-[264px] shrink-0 flex-col border-r border-border bg-surface",
        className,
      )}
    >
      {/* Logo */}
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

      {/* Latest Risk Chip */}
      {latestRisk && (
        <div className="px-4 pb-3">
          <Link
            to="/recommendations"
            search={
              latestRisk.prediction_id
                ? { id: String(latestRisk.prediction_id) }
                : { id: undefined }
            }
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors hover:opacity-80",
              riskChipStyle(latestRisk.risk_class),
            )}
          >
            <Icon name={riskChipIcon(latestRisk.risk_class)} className="text-[14px] shrink-0" />
            <span className="truncate">
              Latest Risk: <strong>{latestRisk.risk_class}</strong>
              {latestRisk.field_name ? ` · ${latestRisk.field_name}` : ""}
            </span>
            <Icon name="arrow_forward" className="text-[12px] shrink-0 ml-auto" />
          </Link>
        </div>
      )}

      {/* Navigation */}
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

      {/* Account Switcher Footer */}
      <div ref={switcherRef} className="relative shrink-0 border-t border-border/60 p-4">
        {/* Account Switcher Popover */}
        {switcherOpen && (
          <div className="absolute bottom-full left-4 right-4 mb-2 rounded-2xl border border-border bg-surface shadow-lg z-50 overflow-hidden">
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
          className="flex w-full items-center gap-3 rounded-2xl border border-border/80 bg-background/50 px-3 py-2.5 text-left transition-colors hover:bg-muted"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-semibold text-primary">
            {initials}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-foreground">{displayName}</span>
            <span className="truncate text-xs text-muted-foreground">
              {displayRole} · {displayEmail || "Not signed in"}
            </span>
          </span>
          <Icon
            name={switcherOpen ? "expand_more" : "unfold_more"}
            className="text-[18px] text-muted-foreground shrink-0"
          />
        </button>
      </div>
    </aside>
  );
}
