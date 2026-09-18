import { createFileRoute } from "@tanstack/react-router";
import { CarePathView } from "@/features/care-path/CarePathView";

export const Route = createFileRoute("/_app/care-path")({
  head: () => ({
    meta: [
      { title: "Recovery Plan: Tomato Early Blight — ProCrop Care Path" },
      {
        name: "description",
        content:
          "A systematic 14-day intervention protocol to halt Alternaria solani progression and stabilize tomato crop yield.",
      },
      { property: "og:title", content: "Recovery Plan: Tomato Early Blight — ProCrop" },
      {
        property: "og:description",
        content: "14-day guided intervention protocol to halt early blight and stabilize yield.",
      },
    ],
  }),
  component: CarePathView,
});
