import type { RiskLevel, RiskMetaItem } from "@/types/common";

export const riskMeta: Record<RiskLevel, RiskMetaItem> = {
  low: {
    label: "Low Risk",
    dot: "bg-risk-low",
    text: "text-risk-low",
    bg: "bg-risk-low/10",
    border: "border-risk-low/30",
    ring: "var(--risk-low)",
  },
  moderate: {
    label: "Moderate Risk",
    dot: "bg-risk-moderate",
    text: "text-risk-moderate",
    bg: "bg-risk-moderate/15",
    border: "border-risk-moderate/40",
    ring: "var(--risk-moderate)",
  },
  high: {
    label: "High Risk",
    dot: "bg-risk-high",
    text: "text-risk-high",
    bg: "bg-risk-high/15",
    border: "border-risk-high/40",
    ring: "var(--risk-high)",
  },
  critical: {
    label: "Critical Risk",
    dot: "bg-risk-critical",
    text: "text-risk-critical",
    bg: "bg-risk-critical/10",
    border: "border-risk-critical/30",
    ring: "var(--risk-critical)",
  },
};
