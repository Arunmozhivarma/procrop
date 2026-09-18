import type { RiskLevel } from "./common";

export type Recommendation = {
  id: string;
  title: string;
  category: "Irrigation" | "Nutrients" | "Monitoring" | "Pest control" | "Disease control";
  icon: string;
  fieldId: string;
  fieldName: string;
  priority: RiskLevel;
  window: string;
  effort: string;
  impact: string;
  summary: string;
  reason: string;
  steps: { id: string; label: string; done: boolean }[];
  status: "pending" | "in-progress" | "done";
  predictionId?: string;
};

export type Alert = {
  id: string;
  title: string;
  body: string;
  severity: RiskLevel;
  source: "Soil sensor" | "Weather" | "AI risk model" | "Image analysis" | "Device";
  fieldId: string;
  fieldName: string;
  createdAt: string;
  read: boolean;
  action?: { label: string; to: string };
};
