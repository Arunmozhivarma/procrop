export type NavItem = {
  to: string;
  label: string;
  icon: string;
};

export type NavGroup = {
  label: string;
  items: readonly NavItem[];
};

export const navGroups = [
  {
    label: "Monitor",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: "space_dashboard" },
    ],
  },
  {
    label: "Sense",
    items: [
      { to: "/soil", label: "Soil", icon: "landslide" },
      { to: "/environment", label: "Environment", icon: "cloud" },
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
