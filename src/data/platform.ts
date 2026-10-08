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
  overall: 68,
  soil: 74,
  environment: 61,
  disease: 18,
  pest: 82, // Jassid pest risk (high this week)
  imageHealth: 72,
};

// SMW-based Jassid population trend for the season (SMW 25–45)
const jassidSeason = [
  0.4, 0.6, 0.8, 1.0, 1.2, 1.3, 0.9, 1.5, 2.4, 1.5, 1.3, 1.7, 2.1, 2.6, 2.2, 1.8, 1.4, 1.1, 0.8,
  0.5, 0.3,
];

export const seasonTrend: SeriesPoint[] = jassidSeason.map((count, i) => {
  const rnd = seedRandom(i * 13 + 5);
  return {
    date: `SMW ${25 + i}`,
    jassid: round(count, 1),
    pest: round(Math.min(100, (count / 3.5) * 100)),
    weather: round(55 + Math.sin(i / 4) * 18 + (rnd() - 0.5) * 8),
  };
});

// ─── Actual Project Datasets ──────────────────────────────────────────────────

export const datasets = [
  {
    name: "01_Final_Jassid_Core.xlsx",
    source: "AICRP Cotton + IMD Weather, Coimbatore",
    purpose:
      "Broader extracted dataset — raw Jassid counts per 3 leaves (Table 102), current + lagged weather features, SMW alignment. 50 SMW rows.",
    rows: "50",
  },
  {
    name: "02_Jassid_Model_Ready.xlsx",
    source: "Derived from 01_Final_Jassid_Core.xlsx",
    purpose:
      "Model-ready dataset after lag creation (jassid_lag_1, jassid_lag_2, weather lags), target variable (target_next_week_jassid), and experimental HIGH/LOW risk classification (≥ 1.95 median rule). 40 rows used for ML.",
    rows: "40",
  },
];
