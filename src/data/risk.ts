import type { RiskLevel, SeriesPoint } from "@/types/common";
import type { ImageAnalysis, ModelPerformanceItem, Prediction } from "@/types/risk";

function round(n: number, d = 0) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

function seedRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const leafImg = (seed: string) => `https://picsum.photos/seed/${seed}/640/480`;

export const severityMeta: Record<ImageAnalysis["severity"], { label: string; risk: RiskLevel }> = {
  none: { label: "Healthy", risk: "low" },
  mild: { label: "Mild", risk: "moderate" },
  moderate: { label: "Moderate", risk: "high" },
  severe: { label: "Severe", risk: "critical" },
};

// ─── Jassid Predictions — Coimbatore Cotton ──────────────────────────────────

export const predictions: Prediction[] = [
  {
    id: "pred-j037",
    fieldId: "field-cotton",
    fieldName: "Cotton Block — Jassid Trial Plot",
    crop: "Cotton",
    createdAt: "2026-09-15T06:00:00Z",
    model: "Ensemble (RF + XGBoost)",
    healthScore: 54,
    diseaseRisk: 0.18,
    pestRisk: 0.82,
    confidence: 0.88,
    headline: "HIGH Jassid risk predicted for next week (SMW 38)",
    narrative:
      "Current-week Jassid count of 2.1 per 3 leaves (SMW 37) exceeds the experimental threshold of 1.95. Combined with elevated morning RH (82%), warm temperatures and the previous week's count of 1.8, the model predicts continued HIGH Jassid pressure in SMW 38. Both Random Forest and XGBoost classify next-week risk as HIGH with strong confidence.",
    requiresImage: true,
    contributions: [
      { feature: "Jassid lag 1 (SMW 37)", value: "2.1 / 3 leaves", impact: 0.38 },
      { feature: "Mean RH %", value: "70%", impact: 0.22 },
      { feature: "Max temperature", value: "34.2 °C", impact: 0.16 },
      { feature: "Rainfall mm", value: "18 mm", impact: -0.12 },
      { feature: "Jassid lag 2 (SMW 36)", value: "1.8 / 3 leaves", impact: 0.11 },
      { feature: "Sunshine hours", value: "6.4 h", impact: 0.08 },
      { feature: "Wind speed km/h", value: "9 km/h", impact: -0.05 },
    ],
    suspectedIssues: [
      { name: "Jassid (Amrasca biguttula biguttula) — HIGH", probability: 0.82 },
      { name: "Whitefly (secondary pressure)", probability: 0.14 },
    ],
  },
  {
    id: "pred-j033",
    fieldId: "field-cotton",
    fieldName: "Cotton Block — Jassid Trial Plot",
    crop: "Cotton",
    createdAt: "2026-08-18T06:00:00Z",
    model: "Random Forest",
    healthScore: 81,
    diseaseRisk: 0.1,
    pestRisk: 0.31,
    confidence: 0.84,
    headline: "LOW Jassid risk predicted for next week (SMW 34)",
    narrative:
      "Current Jassid count of 1.5 per 3 leaves (SMW 33) stays below the experimental median threshold of 1.95. Above-average rainfall (24 mm) and reduced sunshine hours likely suppressed pest build-up. The model classifies next-week risk as LOW. Continue routine scouting — record 3-leaf counts at the same plot stations.",
    requiresImage: false,
    contributions: [
      { feature: "Jassid lag 1 (SMW 33)", value: "1.5 / 3 leaves", impact: -0.29 },
      { feature: "Rainfall mm", value: "24 mm", impact: -0.21 },
      { feature: "Sunshine hours", value: "4.1 h", impact: -0.18 },
      { feature: "Mean RH %", value: "65%", impact: 0.11 },
      { feature: "Max temperature", value: "32.8 °C", impact: 0.09 },
      { feature: "Jassid lag 2 (SMW 32)", value: "1.3 / 3 leaves", impact: -0.07 },
    ],
    suspectedIssues: [
      { name: "Jassid — LOW risk (below 1.95 threshold)", probability: 0.31 },
    ],
  },
  {
    id: "pred-j029",
    fieldId: "field-cotton",
    fieldName: "Cotton Block — Jassid Trial Plot",
    crop: "Cotton",
    createdAt: "2026-07-21T06:00:00Z",
    model: "XGBoost",
    healthScore: 76,
    diseaseRisk: 0.12,
    pestRisk: 0.44,
    confidence: 0.79,
    headline: "MODERATE — Jassid population building (SMW 30)",
    narrative:
      "Jassid counts have risen from 0.8 to 1.2 over two consecutive weeks. Count remains below the 1.95 threshold but the upward trend warrants increased monitoring. Hot, dry conditions with low rainfall and 7.8 sunshine hours create favourable conditions for Jassid population build-up. Early intervention may prevent HIGH risk in SMW 31.",
    requiresImage: false,
    contributions: [
      { feature: "Jassid lag 1 (SMW 29)", value: "1.2 / 3 leaves", impact: 0.24 },
      { feature: "Sunshine hours", value: "7.8 h", impact: 0.21 },
      { feature: "Max temperature", value: "36.1 °C", impact: 0.19 },
      { feature: "Rainfall mm", value: "3 mm", impact: 0.14 },
      { feature: "Jassid lag 2 (SMW 28)", value: "0.8 / 3 leaves", impact: 0.09 },
      { feature: "Mean RH %", value: "55%", impact: -0.08 },
    ],
    suspectedIssues: [
      { name: "Jassid — MODERATE (trending upward)", probability: 0.44 },
      { name: "Thrips (dry-weather secondary)", probability: 0.18 },
    ],
  },
];

// ─── SMW Jassid Population Trend (SMW 25–45) ─────────────────────────────────

// Actual-inspired Jassid counts per 3 leaves, Coimbatore pattern
const jassidCounts = [
  0.4, 0.6, 0.8, 1.0, 1.2, 1.3, 0.9, 1.5, 2.4, 1.5,
  1.3, 1.7, 2.1, 2.6, 2.2, 1.8, 1.4, 1.1, 0.8, 0.5, 0.3,
];

export const riskTimeline: SeriesPoint[] = jassidCounts.map((count, i) => ({
  date: `SMW ${25 + i}`,
  jassid: round(count, 1),
  // Normalise count to a 0–100 risk score for the timeline chart (threshold = 1.95)
  pest: round(Math.min(100, (count / 3.5) * 100)),
  disease: round(10 + Math.sin(i / 4) * 5),
}));

// ─── Model Performance — Experiment A vs B ───────────────────────────────────

export const modelPerformance: ModelPerformanceItem[] = [
  {
    model: "Exp A — Weather only (Random Forest)",
    accuracy: 0.775,
    precision: 0.762,
    recall: 0.748,
    f1: 0.755,
  },
  {
    model: "Exp A — Weather only (XGBoost)",
    accuracy: 0.8,
    precision: 0.787,
    recall: 0.772,
    f1: 0.779,
  },
  {
    model: "Exp B — Weather + Pest history (Random Forest)",
    accuracy: 0.875,
    precision: 0.862,
    recall: 0.851,
    f1: 0.856,
  },
  {
    model: "Exp B — Weather + Pest history (XGBoost)",
    accuracy: 0.9,
    precision: 0.889,
    recall: 0.876,
    f1: 0.882,
  },
];

// ─── Image Analyses ───────────────────────────────────────────────────────────

export const imageAnalyses: ImageAnalysis[] = [
  {
    id: "img-j001",
    fieldId: "field-cotton",
    fieldName: "Cotton Block — Jassid Trial Plot",
    crop: "Cotton",
    capturedAt: "2026-09-15T07:30:00Z",
    thumb: leafImg("cotton-jassid-1"),
    label: "Jassid damage — leaf curl and yellowing",
    confidence: 0.87,
    severity: "moderate",
    affectedArea: 28,
    status: "complete",
    predictionId: "pred-j037",
    symptoms: [
      {
        icon: "rotate_right",
        title: "Leaf curling (hopper burn)",
        body: "Upward rolling of leaf margins on cotton leaves — classic Jassid toxicogenic feeding symptom.",
      },
      {
        icon: "lens_blur",
        title: "Marginal yellowing",
        body: "Chlorosis progressing from leaf tip inward, caused by Jassid phloem sap removal.",
      },
    ],
    gradcam: [
      { x: 18, y: 24, w: 30, h: 22, label: "Leaf curl cluster · 0.88" },
      { x: 55, y: 48, w: 24, h: 20, label: "Yellowed margin · 0.73" },
    ],
  },
  {
    id: "img-j002",
    fieldId: "field-cotton",
    fieldName: "Cotton Block — Jassid Trial Plot",
    crop: "Cotton",
    capturedAt: "2026-08-18T08:10:00Z",
    thumb: leafImg("cotton-healthy"),
    label: "Healthy cotton leaf — low Jassid pressure",
    confidence: 0.91,
    severity: "none",
    affectedArea: 0,
    status: "complete",
    predictionId: "pred-j033",
    symptoms: [
      {
        icon: "verified",
        title: "No Jassid damage detected",
        body: "Leaf texture, colour and margin integrity are within normal range.",
      },
    ],
    gradcam: [],
  },
];
