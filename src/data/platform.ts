import type { SeriesPoint } from "@/types/common";

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

export const platformScores = {
  overall: 78,
  soil: 74,
  environment: 66,
  disease: 100 - 78,
  pest: 100 - 54,
  imageHealth: 82,
};

export const seasonTrend: SeriesPoint[] = Array.from({ length: 24 }, (_, i) => {
  const rnd = seedRandom(i * 17 + 3);
  return {
    date: `W${i + 1}`,
    health: round(72 + Math.sin(i / 3) * 9 + (rnd() - 0.5) * 6),
    disease: round(30 + Math.sin(i / 4 + 2) * 18 + (rnd() - 0.5) * 8),
    pest: round(26 + Math.sin(i / 5 + 1) * 14 + (rnd() - 0.5) * 8),
  };
});

export const datasets = [
  {
    name: "Soil Dataset",
    source: "Kaggle",
    purpose: "Soil parameters for soil condition analysis",
    rows: "12.4k",
  },
  {
    name: "Crop Recommendation (LightGBM)",
    source: "Kaggle",
    purpose: "Soil nutrients and climatic conditions",
    rows: "2.2k",
  },
  {
    name: "Crop Analysis and Prediction",
    source: "Kaggle",
    purpose: "Crop and environmental parameters",
    rows: "8.6k",
  },
  {
    name: "Plant Health Prediction",
    source: "Kaggle",
    purpose: "Plant health and agricultural condition features",
    rows: "5.1k",
  },
  {
    name: "Leaf Diseases Detection",
    source: "Kaggle",
    purpose: "Leaf imagery for image-based disease identification",
    rows: "27k images",
  },
  {
    name: "What Crop to Grow",
    source: "Kaggle",
    purpose: "Soil and environmental parameters for crop selection",
    rows: "2.2k",
  },
];
