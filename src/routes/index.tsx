import { createFileRoute } from "@tanstack/react-router";
import { LandingView } from "@/features/landing/LandingView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ProCrop — Cotton Jassid Risk Prediction · Coimbatore" },
      {
        name: "description",
        content:
          "Machine Learning-based prediction of next-week Cotton Jassid risk in Coimbatore using weather and historical pest data with Random Forest, XGBoost and SHAP explainability.",
      },
      { property: "og:title", content: "ProCrop — Cotton Jassid Risk Prediction · Coimbatore" },
      {
        property: "og:description",
        content:
          "Machine Learning-based prediction of next-week Cotton Jassid risk in Coimbatore using weather and historical pest data with Random Forest, XGBoost and SHAP explainability.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingView,
});
