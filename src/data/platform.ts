import type { SeriesPoint } from "@/types/common";
// These metrics are calculated from database-backed records by the API.
export const platformScores = { overall: 0, soil: 0, environment: 0, disease: 0, pest: 0, imageHealth: 0 };
export const seasonTrend: SeriesPoint[] = [];
export const datasets = [];
