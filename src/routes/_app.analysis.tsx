import { createFileRoute } from "@tanstack/react-router";
import { AnalysisView } from "@/features/analysis/AnalysisView";

export const Route = createFileRoute("/_app/analysis")({
  head: () => ({
    meta: [
      { title: "Zone 4 Deep Dive — ProCrop Detailed Health Analysis" },
      {
        name: "description",
        content:
          "NDVI, thermal and soil moisture layers with sub-zone metrics and a satellite pass timeline for Zone 4.",
      },
      { property: "og:title", content: "Zone 4 Deep Dive — ProCrop Detailed Health Analysis" },
      {
        property: "og:description",
        content: "NDVI, thermal and moisture layers with sub-zone metrics and pass timeline.",
      },
    ],
  }),
  component: AnalysisView,
});
