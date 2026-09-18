import { createFileRoute } from "@tanstack/react-router";
import { DiagnosticView } from "@/features/diagnostic/DiagnosticView";

export const Route = createFileRoute("/_app/diagnostic")({
  head: () => ({
    meta: [
      { title: "Smart Diagnostic — ProCrop Crop Disease Scan" },
      {
        name: "description",
        content:
          "Upload a leaf photo and get an instant AI diagnosis with detected symptoms, confidence scores and immediate recommendations.",
      },
      { property: "og:title", content: "Smart Diagnostic — ProCrop Crop Disease Scan" },
      {
        property: "og:description",
        content: "Instant AI crop disease diagnosis with detected symptoms and recommendations.",
      },
    ],
  }),
  component: DiagnosticView,
});
