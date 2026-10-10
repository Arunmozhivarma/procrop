import type { ImageAnalysis, ModelPerformanceItem, Prediction } from "@/types/risk";
import type { RiskLevel } from "@/types/common";
export const severityMeta: Record<ImageAnalysis["severity"], { label: string; risk: RiskLevel }> = {
  none: { label: "Healthy", risk: "low" }, mild: { label: "Mild", risk: "moderate" },
  moderate: { label: "Moderate", risk: "high" }, severe: { label: "Severe", risk: "critical" },
};
// These are populated from SQLite by the API at runtime.
export const predictions: Prediction[] = [];
export const imageAnalyses: ImageAnalysis[] = [];
export const riskTimeline = [];
export const modelPerformance: ModelPerformanceItem[] = [];
