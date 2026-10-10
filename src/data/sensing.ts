import type { Device, EnvReading, ForecastDay, SoilMetric } from "@/types/sensing";
// Soil, forecast, and device readings have no corresponding tables in the current database.
export const soilByField: Record<string, SoilMetric[]> = {};
export const environment: EnvReading[] = [];
export const forecast: ForecastDay[] = [];
export const devices: Device[] = [];
