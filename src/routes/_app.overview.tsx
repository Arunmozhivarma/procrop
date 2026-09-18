import { createFileRoute } from "@tanstack/react-router";
import { OverviewView } from "@/features/overview/OverviewView";

export const Route = createFileRoute("/_app/overview")({
  head: () => ({
    meta: [
      { title: "Eco-Pulse Overview — ProCrop Field Vitality" },
      {
        name: "description",
        content:
          "Live farm vitality map with sector scores, soil metrics and weather at a glance in the ProCrop Eco-Pulse dashboard.",
      },
      { property: "og:title", content: "Eco-Pulse Overview — ProCrop Field Vitality" },
      {
        property: "og:description",
        content: "Live farm vitality map with sector scores, soil metrics and weather at a glance.",
      },
    ],
  }),
  component: OverviewView,
});
