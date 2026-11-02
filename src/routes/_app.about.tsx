import { createFileRoute } from "@tanstack/react-router";
import HowItWorksPage from "./_app.how-it-works";

export const Route = createFileRoute("/_app/about")({
  head: () => ({
    meta: [
      { title: "About & Methods — ProCrop" },
      {
        name: "description",
        content:
          "System architecture, measured machine learning metrics, datasets, expert-rule priors, and live file manifest for ProCrop Cotton Jassid intelligence.",
      },
    ],
  }),
  component: HowItWorksPage,
});
