import type { RiskLevel } from "./common";

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

export type EnvReading = {
  key: string;
  label: string;
  icon: string;
  value: number;
  unit: string;
  ideal: [number, number];
  delta: number;
};

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

export type ForecastDay = {
  day: string;
  icon: string;
  tempHi: number;
  tempLo: number;
  rain: number;
  humidity: number;
  risk: RiskLevel;
};
