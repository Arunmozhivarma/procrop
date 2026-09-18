import { createFileRoute } from "@tanstack/react-router";
import { LandingView } from "@/features/landing/LandingView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ProCrop — AI Crop Health, Soil & Pest Risk Intelligence" },
      {
        name: "description",
        content:
          "ProCrop fuses soil sensors, weather, crop history and leaf imagery into explainable AI risk predictions and field-ready recommendations for farmers.",
      },
      { property: "og:title", content: "ProCrop — AI Crop Health, Soil & Pest Risk Intelligence" },
      {
        property: "og:description",
        content:
          "ProCrop fuses soil sensors, weather, crop history and leaf imagery into explainable AI risk predictions and field-ready recommendations for farmers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingView,
});
