import type { Farm, Field } from "@/types/farm";

export const farms: Farm[] = [
  {
    id: "farm-coimbatore",
    name: "TNAU Cotton Research Station",
    location: "Coimbatore, Tamil Nadu",
    district: "Coimbatore",
    totalHa: 12.4,
    soilType: "Black cotton soil (Vertisol)",
    irrigation: "Drip + rain-fed",
    owner: "AICRP Cotton — South Zone",
    established: "1970",
  },
];

export const fields: Field[] = [
  {
    id: "field-cotton",
    farmId: "farm-coimbatore",
    name: "Cotton Block — Jassid Trial Plot",
    areaHa: 12.4,
    cropId: "crop-cotton",
    crop: "Cotton",
    variety: "MCU-5 / Bt Cotton",
    growthStage: "Boll formation",
    stageProgress: 62,
    sownOn: "2026-06-10",
    healthScore: 68,
    soilScore: 74,
    envScore: 61,
    diseaseRisk: 0.18,
    pestRisk: 0.74,
    lastInspection: "2026-09-15",
    coords: { x: 48, y: 44, r: 90 },
    notes:
      "Jassid count at 2.1 per 3 leaves last week (SMW 36). Exceeds experimental threshold of 1.95. High risk classification predicted for next week.",
  },
];
