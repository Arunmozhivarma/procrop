/**
 * ProCrop mock data layer.
 *
 * Every screen reads from here so a real backend (FastAPI + PostgreSQL) can
 * replace these functions later without touching UI components.
 */

export type RiskLevel = "low" | "moderate" | "high" | "critical";

export const riskMeta: Record<
  RiskLevel,
  { label: string; dot: string; text: string; bg: string; border: string; ring: string }
> = {
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

export function riskFromScore(score: number): RiskLevel {
  if (score >= 80) return "low";
  if (score >= 60) return "moderate";
  if (score >= 40) return "high";
  return "critical";
}

export function riskFromProbability(p: number): RiskLevel {
  if (p < 0.25) return "low";
  if (p < 0.5) return "moderate";
  if (p < 0.75) return "high";
  return "critical";
}

/* ------------------------------------------------------------------ farms */

export type Field = {
  id: string;
  farmId: string;
  name: string;
  areaHa: number;
  cropId: string;
  crop: string;
  variety: string;
  growthStage: string;
  stageProgress: number;
  sownOn: string;
  healthScore: number;
  soilScore: number;
  envScore: number;
  diseaseRisk: number;
  pestRisk: number;
  lastInspection: string;
  coords: { x: number; y: number; r: number };
  notes: string;
};

export type Farm = {
  id: string;
  name: string;
  location: string;
  district: string;
  totalHa: number;
  soilType: string;
  irrigation: string;
  owner: string;
  established: string;
};

export const farms: Farm[] = [
  {
    id: "farm-north",
    name: "Northfield Estate",
    location: "Nashik, Maharashtra",
    district: "Nashik",
    totalHa: 42.5,
    soilType: "Black cotton (Vertisol)",
    irrigation: "Drip + canal",
    owner: "Uma Vardhan",
    established: "2016",
  },
  {
    id: "farm-river",
    name: "Riverbend Plots",
    location: "Thanjavur, Tamil Nadu",
    district: "Thanjavur",
    totalHa: 18.2,
    soilType: "Alluvial loam",
    irrigation: "Canal flood",
    owner: "Uma Vardhan",
    established: "2020",
  },
];

export const fields: Field[] = [
  {
    id: "field-1",
    farmId: "farm-north",
    name: "Sector 1 — Corn Block",
    areaHa: 9.4,
    cropId: "crop-corn",
    crop: "Corn",
    variety: "DKC-9144",
    growthStage: "Tasseling",
    stageProgress: 68,
    sownOn: "2026-04-02",
    healthScore: 92,
    soilScore: 88,
    envScore: 90,
    diseaseRisk: 0.14,
    pestRisk: 0.22,
    lastInspection: "2026-08-15",
    coords: { x: 30, y: 22, r: 80 },
    notes: "Uniform canopy, no lodging observed after last rainfall event.",
  },
  {
    id: "field-2",
    farmId: "farm-north",
    name: "Sector 2 — Wheat Belt",
    areaHa: 12.1,
    cropId: "crop-wheat",
    crop: "Wheat",
    variety: "HD-3226",
    growthStage: "Grain filling",
    stageProgress: 81,
    sownOn: "2026-03-11",
    healthScore: 88,
    soilScore: 84,
    envScore: 79,
    diseaseRisk: 0.28,
    pestRisk: 0.19,
    lastInspection: "2026-08-14",
    coords: { x: 25, y: 72, r: 100 },
    notes: "Slight nitrogen drawdown in the western strip.",
  },
  {
    id: "field-3",
    farmId: "farm-north",
    name: "Sector 4 — Tomato Rows",
    areaHa: 5.6,
    cropId: "crop-tomato",
    crop: "Tomato",
    variety: "Arka Rakshak",
    growthStage: "Fruiting",
    stageProgress: 74,
    sownOn: "2026-05-20",
    healthScore: 61,
    soilScore: 66,
    envScore: 58,
    diseaseRisk: 0.78,
    pestRisk: 0.54,
    lastInspection: "2026-08-17",
    coords: { x: 65, y: 45, r: 60 },
    notes: "Early blight lesions confirmed on lower canopy in the north quadrant.",
  },
  {
    id: "field-4",
    farmId: "farm-river",
    name: "Plot A — Paddy",
    areaHa: 10.8,
    cropId: "crop-rice",
    crop: "Rice",
    variety: "ADT-45",
    growthStage: "Panicle initiation",
    stageProgress: 52,
    sownOn: "2026-06-08",
    healthScore: 77,
    soilScore: 72,
    envScore: 69,
    diseaseRisk: 0.42,
    pestRisk: 0.63,
    lastInspection: "2026-08-16",
    coords: { x: 45, y: 35, r: 90 },
    notes: "Stem borer moth catches rising in pheromone traps.",
  },
  {
    id: "field-5",
    farmId: "farm-river",
    name: "Plot B — Groundnut",
    areaHa: 7.4,
    cropId: "crop-groundnut",
    crop: "Groundnut",
    variety: "TMV-7",
    growthStage: "Pegging",
    stageProgress: 44,
    sownOn: "2026-06-24",
    healthScore: 83,
    soilScore: 80,
    envScore: 76,
    diseaseRisk: 0.21,
    pestRisk: 0.3,
    lastInspection: "2026-08-13",
    coords: { x: 70, y: 68, r: 70 },
    notes: "Soil moisture holding within optimal band after mulching.",
  },
];

export function getFarm(id: string) {
  return farms.find((f) => f.id === id);
}
export function getField(id: string) {
  return fields.find((f) => f.id === id);
}
export function fieldsOfFarm(farmId: string) {
  return fields.filter((f) => f.farmId === farmId);
}

/* ------------------------------------------------------------------ crops */

export type CropStage = { name: string; days: string; done: boolean; risks: string[] };
export type Crop = {
  id: string;
  name: string;
  variety: string;
  season: string;
  fieldIds: string[];
  durationDays: number;
  idealTempC: [number, number];
  idealMoisture: [number, number];
  idealPh: [number, number];
  commonDiseases: string[];
  commonPests: string[];
  stages: CropStage[];
};

export const crops: Crop[] = [
  {
    id: "crop-corn",
    name: "Corn",
    variety: "DKC-9144",
    season: "Kharif 2026",
    fieldIds: ["field-1"],
    durationDays: 120,
    idealTempC: [21, 30],
    idealMoisture: [45, 65],
    idealPh: [5.8, 7.0],
    commonDiseases: ["Northern leaf blight", "Common rust", "Gray leaf spot"],
    commonPests: ["Fall armyworm", "Corn borer"],
    stages: [
      { name: "Germination", days: "0-10", done: true, risks: ["Seedling blight"] },
      { name: "Vegetative", days: "11-45", done: true, risks: ["Fall armyworm"] },
      { name: "Tasseling", days: "46-70", done: false, risks: ["Northern leaf blight", "Rust"] },
      { name: "Grain fill", days: "71-105", done: false, risks: ["Ear rot"] },
      { name: "Maturity", days: "106-120", done: false, risks: ["Storage mould"] },
    ],
  },
  {
    id: "crop-wheat",
    name: "Wheat",
    variety: "HD-3226",
    season: "Rabi 2026",
    fieldIds: ["field-2"],
    durationDays: 145,
    idealTempC: [15, 24],
    idealMoisture: [40, 60],
    idealPh: [6.0, 7.5],
    commonDiseases: ["Yellow rust", "Powdery mildew", "Karnal bunt"],
    commonPests: ["Aphids", "Termites"],
    stages: [
      { name: "Tillering", days: "0-35", done: true, risks: ["Termites"] },
      { name: "Jointing", days: "36-70", done: true, risks: ["Yellow rust"] },
      { name: "Heading", days: "71-105", done: true, risks: ["Powdery mildew"] },
      { name: "Grain filling", days: "106-130", done: false, risks: ["Aphids"] },
      { name: "Harvest", days: "131-145", done: false, risks: [] },
    ],
  },
  {
    id: "crop-tomato",
    name: "Tomato",
    variety: "Arka Rakshak",
    season: "Kharif 2026",
    fieldIds: ["field-3"],
    durationDays: 110,
    idealTempC: [18, 27],
    idealMoisture: [55, 70],
    idealPh: [6.0, 6.8],
    commonDiseases: ["Early blight", "Late blight", "Leaf curl virus"],
    commonPests: ["Whitefly", "Fruit borer"],
    stages: [
      { name: "Nursery", days: "0-21", done: true, risks: ["Damping off"] },
      { name: "Vegetative", days: "22-45", done: true, risks: ["Whitefly"] },
      { name: "Flowering", days: "46-65", done: true, risks: ["Leaf curl virus"] },
      { name: "Fruiting", days: "66-95", done: false, risks: ["Early blight", "Fruit borer"] },
      { name: "Harvest", days: "96-110", done: false, risks: ["Fruit rot"] },
    ],
  },
  {
    id: "crop-rice",
    name: "Rice",
    variety: "ADT-45",
    season: "Kharif 2026",
    fieldIds: ["field-4"],
    durationDays: 135,
    idealTempC: [22, 32],
    idealMoisture: [70, 90],
    idealPh: [5.5, 6.5],
    commonDiseases: ["Blast", "Bacterial leaf blight", "Sheath blight"],
    commonPests: ["Stem borer", "Brown planthopper"],
    stages: [
      { name: "Nursery", days: "0-25", done: true, risks: ["Blast"] },
      { name: "Tillering", days: "26-55", done: true, risks: ["Stem borer"] },
      { name: "Panicle initiation", days: "56-85", done: false, risks: ["Sheath blight"] },
      { name: "Flowering", days: "86-110", done: false, risks: ["Planthopper"] },
      { name: "Maturity", days: "111-135", done: false, risks: [] },
    ],
  },
  {
    id: "crop-groundnut",
    name: "Groundnut",
    variety: "TMV-7",
    season: "Kharif 2026",
    fieldIds: ["field-5"],
    durationDays: 115,
    idealTempC: [24, 33],
    idealMoisture: [40, 60],
    idealPh: [6.0, 7.0],
    commonDiseases: ["Tikka leaf spot", "Collar rot"],
    commonPests: ["Leaf miner", "White grub"],
    stages: [
      { name: "Emergence", days: "0-15", done: true, risks: ["Collar rot"] },
      { name: "Vegetative", days: "16-40", done: true, risks: ["Leaf miner"] },
      { name: "Pegging", days: "41-70", done: false, risks: ["Tikka leaf spot"] },
      { name: "Pod filling", days: "71-100", done: false, risks: ["White grub"] },
      { name: "Maturity", days: "101-115", done: false, risks: [] },
    ],
  },
];

export function getCrop(id: string) {
  return crops.find((c) => c.id === id);
}

/* ------------------------------------------------------------------- soil */

export type SoilMetric = {
  key: string;
  label: string;
  icon: string;
  value: number;
  unit: string;
  ideal: [number, number];
  range: [number, number];
  status: "optimal" | "low" | "high";
  note: string;
};

export const soilByField: Record<string, SoilMetric[]> = {
  "field-1": buildSoil(52, 6.6, 128, 42, 176, 24.8),
  "field-2": buildSoil(41, 7.1, 96, 38, 150, 25.6),
  "field-3": buildSoil(31, 5.6, 78, 26, 118, 28.9),
  "field-4": buildSoil(74, 6.2, 112, 34, 142, 27.1),
  "field-5": buildSoil(48, 6.8, 104, 40, 160, 26.2),
};

function buildSoil(
  moisture: number,
  ph: number,
  n: number,
  p: number,
  k: number,
  temp: number,
): SoilMetric[] {
  const mk = (
    key: string,
    label: string,
    icon: string,
    value: number,
    unit: string,
    ideal: [number, number],
    range: [number, number],
    note: string,
  ): SoilMetric => ({
    key,
    label,
    icon,
    value,
    unit,
    ideal,
    range,
    status: value < ideal[0] ? "low" : value > ideal[1] ? "high" : "optimal",
    note,
  });

  return [
    mk("moisture", "Soil moisture", "water_drop", moisture, "%", [45, 65], [0, 100],
      "Volumetric water content at 20 cm depth."),
    mk("ph", "pH", "science", ph, "", [6.0, 7.2], [3, 10],
      "Acidity affects nutrient availability, especially phosphorus."),
    mk("n", "Nitrogen (N)", "eco", n, "kg/ha", [100, 160], [0, 250],
      "Drives vegetative growth and canopy density."),
    mk("p", "Phosphorus (P)", "grain", p, "kg/ha", [30, 55], [0, 90],
      "Supports root establishment and flowering."),
    mk("k", "Potassium (K)", "bolt", k, "kg/ha", [140, 220], [0, 320],
      "Improves stress tolerance and disease resistance."),
    mk("temp", "Soil temperature", "device_thermostat", temp, "°C", [20, 28], [5, 45],
      "Governs microbial activity and root uptake."),
  ];
}

export type SeriesPoint = { date: string; [k: string]: number | string };

function seedRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function soilHistory(fieldId: string, days = 30): SeriesPoint[] {
  const base: SoilMetric[] = soilByField[fieldId] ?? soilByField["field-1"] ?? [];
  const rnd = seedRandom(fieldId.length * 97 + 13);
  const get = (k: string) => base.find((m) => m.key === k)?.value ?? 50;
  return Array.from({ length: days }, (_, i) => {
    const t = i / days;
    const wobble = (amp: number) => (rnd() - 0.5) * amp;
    const d = new Date(Date.UTC(2026, 6, 19 + i));
    return {
      date: d.toISOString().slice(5, 10),
      moisture: round(get("moisture") + wobble(9) + Math.sin(i / 3) * 4 - t * 5),
      ph: round(get("ph") + wobble(0.25), 2),
      n: round(get("n") + wobble(14) - t * 10),
      p: round(get("p") + wobble(6)),
      k: round(get("k") + wobble(18)),
      temp: round(get("temp") + wobble(2.4) + Math.sin(i / 5) * 1.5, 1),
    };
  });
}

function round(v: number, d = 0) {
  const m = 10 ** d;
  return Math.round(v * m) / m;
}

export function soilScore(metrics: SoilMetric[]) {
  const per = metrics.map((m) => {
    const [lo, hi] = m.ideal;
    if (m.value >= lo && m.value <= hi) return 100;
    const span = hi - lo || 1;
    const dist = m.value < lo ? lo - m.value : m.value - hi;
    return Math.max(20, 100 - (dist / span) * 90);
  });
  return Math.round(per.reduce((a, b) => a + b, 0) / per.length);
}

/* ------------------------------------------------------- environment data */

export type EnvReading = {
  key: string;
  label: string;
  icon: string;
  value: number;
  unit: string;
  ideal: [number, number];
  delta: number;
};

export const environment: EnvReading[] = [
  { key: "temp", label: "Air temperature", icon: "thermostat", value: 31.4, unit: "°C", ideal: [18, 30], delta: 1.8 },
  { key: "humidity", label: "Relative humidity", icon: "humidity_percentage", value: 84, unit: "%", ideal: [50, 75], delta: 9 },
  { key: "rainfall", label: "Rainfall (24h)", icon: "rainy", value: 26, unit: "mm", ideal: [0, 20], delta: 14 },
  { key: "wind", label: "Wind speed", icon: "air", value: 11, unit: "km/h", ideal: [0, 25], delta: -3 },
  { key: "leafwet", label: "Leaf wetness", icon: "dew_point", value: 9.2, unit: "h/day", ideal: [0, 6], delta: 3.4 },
  { key: "solar", label: "Solar radiation", icon: "wb_sunny", value: 412, unit: "W/m²", ideal: [350, 800], delta: -88 },
];

export function environmentHistory(days = 30): SeriesPoint[] {
  const rnd = seedRandom(4711);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.UTC(2026, 6, 19 + i));
    return {
      date: d.toISOString().slice(5, 10),
      temp: round(29 + Math.sin(i / 4) * 3 + (rnd() - 0.5) * 2, 1),
      humidity: round(72 + Math.sin(i / 3 + 1) * 12 + (rnd() - 0.5) * 6),
      rainfall: round(Math.max(0, Math.sin(i / 2.4) * 14 + (rnd() - 0.35) * 18)),
      stress: round(38 + Math.sin(i / 5) * 18 + (rnd() - 0.4) * 12),
    };
  });
}

export const forecast = [
  { day: "Mon", icon: "rainy", tempHi: 31, tempLo: 24, rain: 18, humidity: 86, risk: "high" as RiskLevel },
  { day: "Tue", icon: "rainy", tempHi: 30, tempLo: 24, rain: 24, humidity: 89, risk: "critical" as RiskLevel },
  { day: "Wed", icon: "cloud", tempHi: 32, tempLo: 25, rain: 6, humidity: 78, risk: "high" as RiskLevel },
  { day: "Thu", icon: "partly_cloudy_day", tempHi: 33, tempLo: 25, rain: 2, humidity: 68, risk: "moderate" as RiskLevel },
  { day: "Fri", icon: "sunny", tempHi: 34, tempLo: 26, rain: 0, humidity: 58, risk: "low" as RiskLevel },
  { day: "Sat", icon: "sunny", tempHi: 34, tempLo: 26, rain: 0, humidity: 55, risk: "low" as RiskLevel },
  { day: "Sun", icon: "partly_cloudy_day", tempHi: 32, tempLo: 25, rain: 4, humidity: 63, risk: "moderate" as RiskLevel },
];

/* -------------------------------------------------------- AI predictions */

export type FeatureContribution = { feature: string; value: string; impact: number };

export type Prediction = {
  id: string;
  fieldId: string;
  fieldName: string;
  crop: string;
  createdAt: string;
  model: "Random Forest" | "XGBoost" | "Ensemble (RF + XGBoost)";
  healthScore: number;
  diseaseRisk: number;
  pestRisk: number;
  confidence: number;
  headline: string;
  narrative: string;
  requiresImage: boolean;
  contributions: FeatureContribution[];
  suspectedIssues: { name: string; probability: number }[];
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

export function getPrediction(id: string) {
  return predictions.find((p) => p.id === id);
}

export const riskTimeline: SeriesPoint[] = Array.from({ length: 21 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 6, 28 + i));
  const rnd = seedRandom(i * 31 + 7);
  return {
    date: d.toISOString().slice(5, 10),
    disease: round(Math.min(0.95, 0.2 + i * 0.028 + (rnd() - 0.5) * 0.08) * 100),
    pest: round(Math.min(0.9, 0.18 + i * 0.018 + (rnd() - 0.5) * 0.1) * 100),
  };
});

export const modelPerformance = [
  { model: "Random Forest — crop condition", accuracy: 0.912, precision: 0.9, recall: 0.888, f1: 0.894 },
  { model: "XGBoost — pest risk", accuracy: 0.897, precision: 0.881, recall: 0.902, f1: 0.891 },
  { model: "XGBoost — disease risk", accuracy: 0.905, precision: 0.894, recall: 0.879, f1: 0.886 },
  { model: "CNN — leaf disease (images)", accuracy: 0.943, precision: 0.938, recall: 0.929, f1: 0.933 },
];

/* ----------------------------------------------------------- image analysis */

export type ImageAnalysis = {
  id: string;
  fieldId: string;
  fieldName: string;
  crop: string;
  capturedAt: string;
  thumb: string;
  label: string;
  confidence: number;
  severity: "none" | "mild" | "moderate" | "severe";
  affectedArea: number;
  status: "complete" | "processing" | "failed";
  symptoms: { icon: string; title: string; body: string }[];
  gradcam: { x: number; y: number; w: number; h: number; label: string }[];
  predictionId?: string;
};

const leafImg = (seed: string) => `https://picsum.photos/seed/${seed}/640/480`;

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
      { icon: "content_cut", title: "Dead heart", body: "Central shoot dries while outer leaves stay green." },
      { icon: "pest_control", title: "Entry holes", body: "Small bore holes visible at the base of tillers." },
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
    symptoms: [{ icon: "verified", title: "No lesions detected", body: "Canopy colour and texture are uniform." }],
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
    symptoms: [{ icon: "grain", title: "Pustule streaks", body: "Faint yellow stripes along leaf veins." }],
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
    symptoms: [{ icon: "blur_circular", title: "Dark circular spots", body: "Scattered spots on upper leaf surface." }],
    gradcam: [{ x: 50, y: 35, w: 18, h: 18, label: "Spot cluster · 0.79" }],
  },
];

export function getImageAnalysis(id: string) {
  return imageAnalyses.find((i) => i.id === id);
}

export const severityMeta: Record<ImageAnalysis["severity"], { label: string; risk: RiskLevel }> = {
  none: { label: "Healthy", risk: "low" },
  mild: { label: "Mild", risk: "moderate" },
  moderate: { label: "Moderate", risk: "high" },
  severe: { label: "Severe", risk: "critical" },
};

/* ------------------------------------------------------- recommendations */

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

export const recommendations: Recommendation[] = [
  {
    id: "rec-501",
    title: "Apply protectant fungicide to tomato block",
    category: "Disease control",
    icon: "sanitizer",
    fieldId: "field-3",
    fieldName: "Sector 4 — Tomato Rows",
    priority: "critical",
    window: "Within 24 hours",
    effort: "2 h · 1 sprayer",
    impact: "Prevents ~18% yield loss",
    summary:
      "Spray mancozeb 75% WP at 2 g/L across the north quadrant, prioritising the lower canopy.",
    reason:
      "Confirmed early blight lesions plus a 9-hour leaf-wetness window make rapid spread likely within 72 hours.",
    status: "in-progress",
    predictionId: "pred-1042",
    steps: [
      { id: "s1", label: "Prune and destroy infected lower leaves", done: true },
      { id: "s2", label: "Sanitise tools between rows", done: true },
      { id: "s3", label: "Spray protectant fungicide at dusk", done: false },
      { id: "s4", label: "Re-scout after 5 days and re-photograph", done: false },
    ],
  },
  {
    id: "rec-502",
    title: "Raise irrigation to 55% soil moisture",
    category: "Irrigation",
    icon: "water_drop",
    fieldId: "field-3",
    fieldName: "Sector 4 — Tomato Rows",
    priority: "high",
    window: "Next 2 days",
    effort: "45 min · drip schedule",
    impact: "Restores turgor, reduces stress",
    summary: "Add two 20-minute drip cycles per day until moisture holds above 50%.",
    reason: "Soil moisture at 31% is 14 points below the optimal band for fruiting tomato.",
    status: "pending",
    predictionId: "pred-1042",
    steps: [
      { id: "s1", label: "Verify drip line pressure", done: false },
      { id: "s2", label: "Add morning and evening cycles", done: false },
      { id: "s3", label: "Recheck sensor reading after 48 h", done: false },
    ],
  },
  {
    id: "rec-503",
    title: "Install pheromone traps in paddy plot",
    category: "Pest control",
    icon: "pest_control",
    fieldId: "field-4",
    fieldName: "Plot A — Paddy",
    priority: "high",
    window: "This week",
    effort: "1.5 h · 8 traps",
    impact: "Cuts borer generation build-up",
    summary: "Place 8 traps/ha and record catches every third day.",
    reason: "Trap counts rose from 6 to 18 moths per trap over ten days.",
    status: "pending",
    predictionId: "pred-1041",
    steps: [
      { id: "s1", label: "Install traps at 10 m spacing", done: false },
      { id: "s2", label: "Log catch counts every 3 days", done: false },
      { id: "s3", label: "Release Trichogramma cards if counts persist", done: false },
    ],
  },
  {
    id: "rec-504",
    title: "Top-dress nitrogen on the western wheat strip",
    category: "Nutrients",
    icon: "compost",
    fieldId: "field-2",
    fieldName: "Sector 2 — Wheat Belt",
    priority: "moderate",
    window: "Next 5 days",
    effort: "3 h · 40 kg/ha urea",
    impact: "Supports grain filling",
    summary: "Apply 40 kg/ha urea followed by light irrigation.",
    reason: "Nitrogen at 96 kg/ha sits below the 100–160 optimal band during grain filling.",
    status: "pending",
    steps: [
      { id: "s1", label: "Confirm soil test on western strip", done: false },
      { id: "s2", label: "Broadcast urea evenly", done: false },
      { id: "s3", label: "Irrigate lightly within 12 h", done: false },
    ],
  },
  {
    id: "rec-505",
    title: "Continue weekly scouting on corn block",
    category: "Monitoring",
    icon: "visibility",
    fieldId: "field-1",
    fieldName: "Sector 1 — Corn Block",
    priority: "low",
    window: "Weekly",
    effort: "30 min",
    impact: "Maintains early detection",
    summary: "Walk two diagonals and photograph five plants per diagonal.",
    reason: "All indicators are optimal; routine monitoring is sufficient.",
    status: "done",
    steps: [
      { id: "s1", label: "Walk diagonal scouting pattern", done: true },
      { id: "s2", label: "Upload five canopy photos", done: true },
    ],
  },
];

export function getRecommendation(id: string) {
  return recommendations.find((r) => r.id === id);
}

/* -------------------------------------------------------------- alerts */

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

export const alerts: Alert[] = [
  {
    id: "alert-901",
    title: "Critical disease risk — tomato block",
    body: "Early blight probability reached 78%. Image analysis confirmed lesions on the lower canopy.",
    severity: "critical",
    source: "AI risk model",
    fieldId: "field-3",
    fieldName: "Sector 4 — Tomato Rows",
    createdAt: "2026-08-17T06:12:00Z",
    read: false,
    action: { label: "View risk assessment", to: "/risk/disease" },
  },
  {
    id: "alert-900",
    title: "Soil moisture below threshold",
    body: "Sector 4 moisture fell to 31%, 14 points under the optimal band for fruiting tomato.",
    severity: "high",
    source: "Soil sensor",
    fieldId: "field-3",
    fieldName: "Sector 4 — Tomato Rows",
    createdAt: "2026-08-17T04:45:00Z",
    read: false,
    action: { label: "Open soil monitoring", to: "/soil" },
  },
  {
    id: "alert-899",
    title: "Stem borer trap count doubled",
    body: "Pheromone traps in Plot A recorded 18 moths per trap, up from 9 last week.",
    severity: "high",
    source: "AI risk model",
    fieldId: "field-4",
    fieldName: "Plot A — Paddy",
    createdAt: "2026-08-16T18:30:00Z",
    read: false,
    action: { label: "View pest risk", to: "/risk/pest" },
  },
  {
    id: "alert-898",
    title: "Heavy rainfall expected",
    body: "24 mm forecast for Tuesday with 89% humidity — elevated fungal infection window.",
    severity: "moderate",
    source: "Weather",
    fieldId: "field-3",
    fieldName: "Sector 4 — Tomato Rows",
    createdAt: "2026-08-16T09:00:00Z",
    read: true,
    action: { label: "See forecast", to: "/environment/forecast" },
  },
  {
    id: "alert-897",
    title: "Sensor offline",
    body: "Node ESP32-N04 has not reported for 6 hours. Battery last seen at 12%.",
    severity: "moderate",
    source: "Device",
    fieldId: "field-5",
    fieldName: "Plot B — Groundnut",
    createdAt: "2026-08-15T21:15:00Z",
    read: true,
    action: { label: "Check devices", to: "/devices" },
  },
  {
    id: "alert-896",
    title: "Nitrogen drawdown detected",
    body: "Wheat belt nitrogen trending down through grain filling.",
    severity: "low",
    source: "Soil sensor",
    fieldId: "field-2",
    fieldName: "Sector 2 — Wheat Belt",
    createdAt: "2026-08-15T07:05:00Z",
    read: true,
    action: { label: "View nutrients", to: "/soil/nutrients" },
  },
];

/* -------------------------------------------------------------- devices */

export type Device = {
  id: string;
  name: string;
  model: string;
  fieldId: string;
  fieldName: string;
  status: "online" | "offline" | "maintenance";
  battery: number;
  signal: number;
  lastSeen: string;
  firmware: string;
  sensors: string[];
  installedOn: string;
};

export const devices: Device[] = [
  {
    id: "dev-n01",
    name: "ESP32-N01",
    model: "ESP32-WROOM + capacitive probe",
    fieldId: "field-1",
    fieldName: "Sector 1 — Corn Block",
    status: "online",
    battery: 87,
    signal: 92,
    lastSeen: "2 min ago",
    firmware: "v2.4.1",
    sensors: ["Soil moisture", "Soil temperature", "Air temp/humidity"],
    installedOn: "2026-03-14",
  },
  {
    id: "dev-n02",
    name: "ESP32-N02",
    model: "ESP32-WROOM + NPK probe",
    fieldId: "field-2",
    fieldName: "Sector 2 — Wheat Belt",
    status: "online",
    battery: 74,
    signal: 81,
    lastSeen: "5 min ago",
    firmware: "v2.4.1",
    sensors: ["NPK", "pH", "Soil moisture"],
    installedOn: "2026-03-14",
  },
  {
    id: "dev-n03",
    name: "ESP32-N03",
    model: "ESP8266 + leaf wetness",
    fieldId: "field-3",
    fieldName: "Sector 4 — Tomato Rows",
    status: "online",
    battery: 63,
    signal: 68,
    lastSeen: "1 min ago",
    firmware: "v2.3.9",
    sensors: ["Leaf wetness", "Air temp/humidity", "Soil moisture"],
    installedOn: "2026-05-02",
  },
  {
    id: "dev-n04",
    name: "ESP32-N04",
    model: "ESP32-WROOM + rain gauge",
    fieldId: "field-5",
    fieldName: "Plot B — Groundnut",
    status: "offline",
    battery: 12,
    signal: 0,
    lastSeen: "6 h ago",
    firmware: "v2.3.9",
    sensors: ["Rainfall", "Soil moisture"],
    installedOn: "2026-06-01",
  },
  {
    id: "dev-n05",
    name: "ESP32-N05",
    model: "ESP32-WROOM + water level",
    fieldId: "field-4",
    fieldName: "Plot A — Paddy",
    status: "maintenance",
    battery: 55,
    signal: 44,
    lastSeen: "40 min ago",
    firmware: "v2.4.0",
    sensors: ["Water level", "Soil temperature"],
    installedOn: "2026-06-10",
  },
];

export function getDevice(id: string) {
  return devices.find((d) => d.id === id);
}

/* ---------------------------------------------------------- aggregates */

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
  { name: "Soil Dataset", source: "Kaggle", purpose: "Soil parameters for soil condition analysis", rows: "12.4k" },
  { name: "Crop Recommendation (LightGBM)", source: "Kaggle", purpose: "Soil nutrients and climatic conditions", rows: "2.2k" },
  { name: "Crop Analysis and Prediction", source: "Kaggle", purpose: "Crop and environmental parameters", rows: "8.6k" },
  { name: "Plant Health Prediction", source: "Kaggle", purpose: "Plant health and agricultural condition features", rows: "5.1k" },
  { name: "Leaf Diseases Detection", source: "Kaggle", purpose: "Leaf imagery for image-based disease identification", rows: "27k images" },
  { name: "What Crop to Grow", source: "Kaggle", purpose: "Soil and environmental parameters for crop selection", rows: "2.2k" },
];

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
