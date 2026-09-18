import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { DataRow } from "@/components/procrop/ui";
import { datasets, modelPerformance } from "@/lib/procrop-data";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — ProCrop" },
      {
        name: "description",
        content: "Season trends, risk history and model performance across the platform.",
      },
      { property: "og:title", content: "Analytics — ProCrop" },
      {
        property: "og:description",
        content: "Season trends, risk history and model performance across the platform.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <div className="px-5 py-8 md:px-8">
      <PageHeader
        eyebrow="Act"
        title="Analytics"
        description="Season trends, risk history and model performance across the platform."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Model performance" icon="monitoring">
          <div className="space-y-3">
            {modelPerformance.map((m) => (
              <div key={m.model} className="rounded-xl border border-border p-4">
                <p className="font-medium">{m.model}</p>
                <p className="text-xs text-muted-foreground">{m.f1 * 100}% F1</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                  <DataRow label="Accuracy" value={`${Math.round(m.accuracy * 1000) / 10}%`} />
                  <DataRow label="Precision" value={`${Math.round(m.precision * 1000) / 10}%`} />
                  <DataRow label="Recall" value={`${Math.round(m.recall * 1000) / 10}%`} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Datasets" icon="database">
          <div className="space-y-3">
            {datasets.map((d) => (
              <div key={d.name} className="rounded-xl border border-border p-4">
                <p className="font-medium">{d.name}</p>
                <p className="text-xs text-muted-foreground">
                  {d.rows} rows · {d.source}
                </p>
                <p className="mt-1 text-sm text-foreground/70">{d.purpose}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
