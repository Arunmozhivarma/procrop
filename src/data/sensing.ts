import type { Device, EnvReading, ForecastDay, SoilMetric } from "@/types/sensing";

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
    mk(
      "moisture",
      "Soil moisture",
      "water_drop",
      moisture,
      "%",
      [50, 70],
      [0, 100],
      "Volumetric water content at 20 cm depth. Cotton prefers moist but well-drained black soil.",
    ),
    mk(
      "ph",
      "pH",
      "science",
      ph,
      "",
      [5.8, 8.0],
      [3, 10],
      "Black cotton soil (Vertisol) in Coimbatore typically ranges pH 7.5–8.2.",
    ),
    mk(
      "n",
      "Nitrogen (N)",
      "eco",
      n,
      "kg/ha",
      [80, 150],
      [0, 250],
      "Nitrogen drives vegetative growth; excess N can increase Jassid susceptibility.",
    ),
    mk(
      "p",
      "Phosphorus (P)",
      "grain",
      p,
      "kg/ha",
      [30, 60],
      [0, 90],
      "Supports root establishment and boll development in cotton.",
    ),
    mk(
      "k",
      "Potassium (K)",
      "bolt",
      k,
      "kg/ha",
      [120, 200],
      [0, 300],
      "Improves cell wall strength and natural resistance to sap-sucking pests.",
    ),
    mk(
      "temp",
      "Soil temperature",
      "device_thermostat",
      temp,
      "°C",
      [22, 32],
      [5, 45],
      "Governs microbial activity and root uptake in Vertisol.",
    ),
  ];
}

// Single cotton field — Coimbatore black cotton soil values
export const soilByField: Record<string, SoilMetric[]> = {
  "field-cotton": buildSoil(58, 7.8, 112, 44, 158, 28.4),
};

// ─── Current-week Weather Inputs (SMW 37 — Coimbatore) ───────────────────────
// These are the actual feature variables the ML model uses

export const environment: EnvReading[] = [
  {
    key: "max_temp",
    label: "Max temperature",
    icon: "thermostat",
    value: 34.2,
    unit: "°C",
    ideal: [21, 35],
    delta: 1.1,
  },
  {
    key: "min_temp",
    label: "Min temperature",
    icon: "device_thermostat",
    value: 24.1,
    unit: "°C",
    ideal: [18, 27],
    delta: 0.4,
  },
  {
    key: "rh_morning",
    label: "RH morning",
    icon: "humidity_percentage",
    value: 82,
    unit: "%",
    ideal: [60, 85],
    delta: 6,
  },
  {
    key: "rh_evening",
    label: "RH evening",
    icon: "humidity_mid",
    value: 58,
    unit: "%",
    ideal: [40, 65],
    delta: -3,
  },
  {
    key: "rainfall",
    label: "Rainfall",
    icon: "rainy",
    value: 18,
    unit: "mm",
    ideal: [0, 30],
    delta: -6,
  },
  {
    key: "rainy_days",
    label: "Rainy days",
    icon: "cloudy_snowing",
    value: 3,
    unit: "days",
    ideal: [0, 4],
    delta: 0,
  },
  {
    key: "wind_speed",
    label: "Wind speed",
    icon: "air",
    value: 9,
    unit: "km/h",
    ideal: [0, 20],
    delta: -2,
  },
  {
    key: "sunshine",
    label: "Sunshine hours",
    icon: "wb_sunny",
    value: 6.4,
    unit: "h",
    ideal: [5, 9],
    delta: 0.8,
  },
];

// ─── 7-week SMW forecast (Jassid risk outlook) ────────────────────────────────

export const forecast: ForecastDay[] = [
  { day: "SMW 38", icon: "rainy", tempHi: 33, tempLo: 24, rain: 14, humidity: 79, risk: "high" },
  { day: "SMW 39", icon: "cloud", tempHi: 32, tempLo: 24, rain: 20, humidity: 82, risk: "high" },
  {
    day: "SMW 40",
    icon: "partly_cloudy_day",
    tempHi: 33,
    tempLo: 25,
    rain: 8,
    humidity: 72,
    risk: "moderate",
  },
  { day: "SMW 41", icon: "sunny", tempHi: 34, tempLo: 25, rain: 2, humidity: 62, risk: "low" },
  { day: "SMW 42", icon: "sunny", tempHi: 35, tempLo: 26, rain: 0, humidity: 56, risk: "low" },
  {
    day: "SMW 43",
    icon: "partly_cloudy_day",
    tempHi: 33,
    tempLo: 25,
    rain: 6,
    humidity: 64,
    risk: "moderate",
  },
  { day: "SMW 44", icon: "rainy", tempHi: 31, tempLo: 24, rain: 22, humidity: 81, risk: "high" },
];

// ─── IoT Devices ──────────────────────────────────────────────────────────────

export const devices: Device[] = [
  {
    id: "dev-c01",
    name: "ESP32-C01",
    model: "ESP32-WROOM + capacitive + RH probe",
    fieldId: "field-cotton",
    fieldName: "Cotton Block — Jassid Trial Plot",
    status: "online",
    battery: 79,
    signal: 88,
    lastSeen: "3 min ago",
    firmware: "v2.4.1",
    sensors: ["Soil moisture", "Soil temperature", "Air temp/humidity", "Wind speed"],
    installedOn: "2026-06-12",
  },
  {
    id: "dev-c02",
    name: "ESP32-C02",
    model: "ESP32-WROOM + rain gauge",
    fieldId: "field-cotton",
    fieldName: "Cotton Block — Jassid Trial Plot",
    status: "online",
    battery: 64,
    signal: 76,
    lastSeen: "5 min ago",
    firmware: "v2.4.1",
    sensors: ["Rainfall", "Rainy day counter", "Sunshine hours (LDR)"],
    installedOn: "2026-06-12",
  },
];
