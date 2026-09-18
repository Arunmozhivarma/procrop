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

export const predictions: Prediction[] = [
  {
    id: "pred-1042",
    fieldId: "field-3",
    fieldName: "Sector 4 — Tomato Rows",
    crop: "Tomato",
    createdAt: "2026-08-17T06:10:00Z",
    model: "Ensemble (RF + XGBoost)",
    healthScore: 61,
    diseaseRisk: 0.78,
    pestRisk: 0.54,
    confidence: 0.91,
    headline: "High early-blight pressure building in the tomato block",
    narrative:
      "Nine consecutive hours of leaf wetness combined with 84% humidity and warm nights creates the classic Alternaria solani infection window. Soil moisture has fallen below the optimal band, adding water stress that weakens the plant's defence response.",
    requiresImage: true,
    contributions: [
      { feature: "Leaf wetness hours", value: "9.2 h/day", impact: 0.31 },
      { feature: "Relative humidity", value: "84%", impact: 0.24 },
      { feature: "Soil moisture", value: "31%", impact: -0.18 },
      { feature: "Night temperature", value: "24.6 °C", impact: 0.14 },
      { feature: "Growth stage", value: "Fruiting", impact: 0.09 },
      { feature: "Nitrogen", value: "78 kg/ha", impact: -0.07 },
      { feature: "Days since last spray", value: "19", impact: 0.06 },
    ],
    suspectedIssues: [
      { name: "Early blight (Alternaria solani)", probability: 0.74 },
      { name: "Septoria leaf spot", probability: 0.12 },
      { name: "Nutrient scorch", probability: 0.08 },
    ],
  },
  {
    id: "pred-1041",
    fieldId: "field-4",
    fieldName: "Plot A — Paddy",
    crop: "Rice",
    createdAt: "2026-08-16T05:40:00Z",
    model: "XGBoost",
    healthScore: 77,
    diseaseRisk: 0.42,
    pestRisk: 0.63,
    confidence: 0.86,
    headline: "Stem borer pressure rising ahead of panicle initiation",
    narrative:
      "Trap counts, warm nights and dense tillering favour a second stem-borer generation. Disease pressure stays moderate while standing water keeps sheath blight plausible.",
    requiresImage: true,
    contributions: [
      { feature: "Pheromone trap count", value: "18 moths/trap", impact: 0.29 },
      { feature: "Night temperature", value: "25.9 °C", impact: 0.19 },
      { feature: "Tiller density", value: "High", impact: 0.15 },
      { feature: "Standing water depth", value: "7 cm", impact: 0.11 },
      { feature: "Potassium", value: "142 kg/ha", impact: -0.09 },
    ],
    suspectedIssues: [
      { name: "Yellow stem borer", probability: 0.61 },
      { name: "Sheath blight", probability: 0.27 },
    ],
  },
  {
    id: "pred-1040",
    fieldId: "field-2",
    fieldName: "Sector 2 — Wheat Belt",
    crop: "Wheat",
    createdAt: "2026-08-15T05:35:00Z",
    model: "Random Forest",
    healthScore: 88,
    diseaseRisk: 0.28,
    pestRisk: 0.19,
    confidence: 0.83,
    headline: "Stable, with a mild nitrogen drawdown in the western strip",
    narrative:
      "Conditions remain unfavourable for rust. The main limiting factor is nitrogen availability during grain filling.",
    requiresImage: false,
    contributions: [
      { feature: "Nitrogen", value: "96 kg/ha", impact: -0.21 },
      { feature: "Relative humidity", value: "61%", impact: 0.08 },
      { feature: "Soil moisture", value: "41%", impact: -0.06 },
      { feature: "Growth stage", value: "Grain filling", impact: 0.05 },
    ],
    suspectedIssues: [{ name: "Nitrogen deficiency", probability: 0.44 }],
  },
  {
    id: "pred-1039",
    fieldId: "field-1",
    fieldName: "Sector 1 — Corn Block",
    crop: "Corn",
    createdAt: "2026-08-15T05:30:00Z",
    model: "Ensemble (RF + XGBoost)",
    healthScore: 92,
    diseaseRisk: 0.14,
    pestRisk: 0.22,
    confidence: 0.94,
    headline: "Healthy canopy, continue routine monitoring",
    narrative:
      "All structured inputs sit inside the optimal band for tasseling corn. No image upload requested.",
    requiresImage: false,
    contributions: [
      { feature: "Soil moisture", value: "52%", impact: -0.12 },
      { feature: "Nitrogen", value: "128 kg/ha", impact: -0.1 },
      { feature: "Relative humidity", value: "70%", impact: 0.07 },
      { feature: "Rainfall (7d)", value: "48 mm", impact: 0.05 },
    ],
    suspectedIssues: [],
  },
];

export const riskTimeline: SeriesPoint[] = Array.from({ length: 21 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 6, 28 + i));
  const rnd = seedRandom(i * 31 + 7);
  return {
    date: d.toISOString().slice(5, 10),
    disease: round(Math.min(0.95, 0.2 + i * 0.028 + (rnd() - 0.5) * 0.08) * 100),
    pest: round(Math.min(0.9, 0.18 + i * 0.018 + (rnd() - 0.5) * 0.1) * 100),
  };
});

export const modelPerformance: ModelPerformanceItem[] = [
  {
    model: "Random Forest — crop condition",
    accuracy: 0.912,
    precision: 0.9,
    recall: 0.888,
    f1: 0.894,
  },
  { model: "XGBoost — pest risk", accuracy: 0.897, precision: 0.881, recall: 0.902, f1: 0.891 },
  { model: "XGBoost — disease risk", accuracy: 0.905, precision: 0.894, recall: 0.879, f1: 0.886 },
  {
    model: "CNN — leaf disease (images)",
    accuracy: 0.943,
    precision: 0.938,
    recall: 0.929,
    f1: 0.933,
  },
];

export const imageAnalyses: ImageAnalysis[] = [
  {
    id: "img-3021",
    fieldId: "field-3",
    fieldName: "Sector 4 — Tomato Rows",
    crop: "Tomato",
    capturedAt: "2026-08-17T07:20:00Z",
    thumb: leafImg("leaf-blight-1"),
    label: "Early blight (Alternaria solani)",
    confidence: 0.94,
    severity: "moderate",
    affectedArea: 23,
    status: "complete",
    predictionId: "pred-1042",
    symptoms: [
      {
        icon: "target",
        title: "Concentric target spots",
        body: "Dark brown ringed lesions on older, lower foliage.",
      },
      {
        icon: "lens_blur",
        title: "Yellow haloing",
        body: "Chlorosis surrounding necrotic spots indicates active fungal spread.",
      },
    ],
    gradcam: [
      { x: 22, y: 30, w: 26, h: 24, label: "Lesion cluster · 0.91" },
      { x: 58, y: 55, w: 20, h: 18, label: "Chlorotic halo · 0.77" },
    ],
  },
  {
    id: "img-3020",
    fieldId: "field-4",
    fieldName: "Plot A — Paddy",
    crop: "Rice",
    capturedAt: "2026-08-16T16:05:00Z",
    thumb: leafImg("rice-borer"),
    label: "Stem borer damage (dead heart)",
    confidence: 0.88,
    severity: "mild",
    affectedArea: 9,
    status: "complete",
    predictionId: "pred-1041",
    symptoms: [
      {
        icon: "content_cut",
        title: "Dead heart",
        body: "Central shoot dries while outer leaves stay green.",
      },
      {
        icon: "pest_control",
        title: "Entry holes",
        body: "Small bore holes visible at the base of tillers.",
      },
    ],
    gradcam: [{ x: 40, y: 20, w: 22, h: 40, label: "Damaged tiller · 0.84" }],
  },
  {
    id: "img-3019",
    fieldId: "field-1",
    fieldName: "Sector 1 — Corn Block",
    crop: "Corn",
    capturedAt: "2026-08-15T09:12:00Z",
    thumb: leafImg("corn-leaf"),
    label: "Healthy foliage",
    confidence: 0.97,
    severity: "none",
    affectedArea: 0,
    status: "complete",
    symptoms: [
      {
        icon: "verified",
        title: "No lesions detected",
        body: "Canopy colour and texture are uniform.",
      },
    ],
    gradcam: [],
  },
  {
    id: "img-3018",
    fieldId: "field-2",
    fieldName: "Sector 2 — Wheat Belt",
    crop: "Wheat",
    capturedAt: "2026-08-14T11:40:00Z",
    thumb: leafImg("wheat-rust"),
    label: "Early yellow rust (trace)",
    confidence: 0.72,
    severity: "mild",
    affectedArea: 4,
    status: "complete",
    symptoms: [
      { icon: "grain", title: "Pustule streaks", body: "Faint yellow stripes along leaf veins." },
    ],
    gradcam: [{ x: 30, y: 45, w: 34, h: 14, label: "Pustule streak · 0.68" }],
  },
  {
    id: "img-3017",
    fieldId: "field-5",
    fieldName: "Plot B — Groundnut",
    crop: "Groundnut",
    capturedAt: "2026-08-13T08:02:00Z",
    thumb: leafImg("groundnut-leaf"),
    label: "Tikka leaf spot",
    confidence: 0.81,
    severity: "mild",
    affectedArea: 6,
    status: "complete",
    symptoms: [
      {
        icon: "blur_circular",
        title: "Dark circular spots",
        body: "Scattered spots on upper leaf surface.",
      },
    ],
    gradcam: [{ x: 50, y: 35, w: 18, h: 18, label: "Spot cluster · 0.79" }],
  },
];
