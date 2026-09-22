import type { Crop } from "@/types/crop";

export const crops: Crop[] = [
  {
    id: "crop-cotton",
    name: "Cotton",
    variety: "MCU-5 / Bt Cotton (RCH-2)",
    season: "Kharif 2026",
    fieldIds: ["field-cotton"],
    durationDays: 180,
    idealTempC: [21, 35],
    idealMoisture: [50, 70],
    idealPh: [5.8, 8.0],
    commonDiseases: ["Bacterial blight", "Alternaria leaf spot", "Root rot"],
    commonPests: ["Jassid", "Whitefly", "Bollworm", "Aphid", "Thrips"],
    stages: [
      {
        name: "Germination",
        days: "SMW 23–24",
        done: true,
        risks: ["Seedling damping off"],
      },
      {
        name: "Seedling",
        days: "SMW 25–27",
        done: true,
        risks: ["Aphid", "Thrips"],
      },
      {
        name: "Vegetative",
        days: "SMW 28–32",
        done: true,
        risks: ["Jassid", "Whitefly"],
      },
      {
        name: "Squaring",
        days: "SMW 33–36",
        done: true,
        risks: ["Jassid (peak pressure)", "Bollworm"],
      },
      {
        name: "Boll formation",
        days: "SMW 37–42",
        done: false,
        risks: ["Jassid", "Bollworm", "Bacterial blight"],
      },
      {
        name: "Maturity & Picking",
        days: "SMW 43–50",
        done: false,
        risks: ["Storage boll rot"],
      },
    ],
  },
];
