import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/procrop/ui";

export const Route = createFileRoute("/_app/help")({
  head: () => ({
    meta: [
      { title: "Help & guidance — ProCrop" },
      { name: "description", content: "How the ProCrop workflow behaves and answers to common questions." },
      { property: "og:title", content: "Help & guidance — ProCrop" },
      { property: "og:description", content: "How the ProCrop workflow behaves and answers to common questions." },
    ],
  }),
  component: HelpPage,
});

function HelpPage() {
  return (
    <div className="px-5 py-8 md:px-8">
      <PageHeader eyebrow="Manage" title="Help & guidance" description="How the ProCrop workflow behaves and answers to common questions." />
      <div className="grid gap-4 lg:grid-cols-2">
        {[
          ["When does ProCrop ask for a photo?", "Only when the structured models flag elevated disease or pest pressure for a field, so you photograph what matters."],
          ["How is the health score built?", "It blends soil condition, environmental stress, and predicted disease and pest risk into a 0-100 score per field."],
          ["What do the risk bands mean?", "80+ is low, 60-79 moderate, 40-59 high and below 40 critical, matching the colour coding used across the platform."],
          ["Can I use ProCrop without IoT sensors?", "Yes. Manual soil test entries and weather feeds are enough; sensor nodes simply increase the update frequency."],
          ["Where do explanations come from?", "Tabular predictions expose SHAP feature attributions and image diagnoses expose Grad-CAM heatmaps over the leaf."],
          ["Are recommendations automatic?", "They are generated from the current risk state, but every action stays advisory and can be dismissed or rescheduled."],
        ].map(([q, a]) => (
          <Panel key={q} title={q as string} icon="help">
            <p className="text-sm text-foreground/70">{a}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}
