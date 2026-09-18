export type RiskLevel = "low" | "moderate" | "high" | "critical";

export type RiskMetaItem = {
  label: string;
  dot: string;
  text: string;
  bg: string;
  border: string;
  ring: string;
};

export type SeriesPoint = {
  date: string;
  [k: string]: number | string;
};
