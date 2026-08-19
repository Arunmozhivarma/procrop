import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { predictions } from "@/lib/procrop-data";

export const Route = createFileRoute("/_app/explain")({
  head: () => ({
    meta: [
      { title: "Explainability — ProCrop" },
      { name: "description", content: "SHAP feature attributions and Grad-CAM evidence behind every prediction." },
      { property: "og:title", content: "Explainability — ProCrop" },
      { property: "og:description", content: "SHAP feature attributions and Grad-CAM evidence behind every prediction." },
    ],
  }),
  component: ExplainPage,
});

function ExplainPage() {
  return (
    <div className="px-5 py-8 md:px-8">
      <PageHeader eyebrow="Predict" title="Explainability" description="SHAP feature attributions and Grad-CAM evidence behind every prediction." />
      <div className="space-y-4">
        {predictions.map((p) => (
          <Panel key={p.id} title={`Why: ${p.headline}`} subtitle={`${p.model} · ${p.fieldName}`} icon="psychology">
            <ul className="space-y-2 text-sm">
              {p.contributions.map((c) => (
                <li key={c.feature} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                  <span>{c.feature} — <span className="text-muted-foreground">{c.value}</span></span>
                  <Tag>
                    {c.impact >= 0 ? "+" : ""}{c.impact.toFixed(2)}
                  </Tag>
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-foreground/70">
      {children}
    </span>
  );
}
