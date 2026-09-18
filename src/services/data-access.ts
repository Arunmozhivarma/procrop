import { recommendations } from "@/data/advisory";
import { crops } from "@/data/crops";
import { farms, fields } from "@/data/farms";
import { imageAnalyses, predictions } from "@/data/risk";
import { devices } from "@/data/sensing";

export function getFarm(id: string) {
  return farms.find((f) => f.id === id);
}

export function getField(id: string) {
  return fields.find((f) => f.id === id);
}

export function fieldsOfFarm(farmId: string) {
  return fields.filter((f) => f.farmId === farmId);
}

export function getCrop(id: string) {
  return crops.find((c) => c.id === id);
}

export function getPrediction(id: string) {
  return predictions.find((p) => p.id === id);
}

export function getImageAnalysis(id: string) {
  return imageAnalyses.find((i) => i.id === id);
}

export function getRecommendation(id: string) {
  return recommendations.find((r) => r.id === id);
}

export function getDevice(id: string) {
  return devices.find((d) => d.id === id);
}
