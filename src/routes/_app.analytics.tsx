import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { DataRow } from "@/components/procrop/ui";
import { datasets, modelPerformance } from "@/lib/procrop-data";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({
    meta: [
      { title: "Model Analytics — ProCrop" },
      {
        name: "description",
        content:
          "Jassid prediction model performance — Experiment A (weather only) vs Experiment B (weather + pest history).",
      },
      { property: "og:title", content: "Model Analytics — ProCrop" },
      {
        property: "og:description",
        content:
          "Jassid prediction model performance — Experiment A (weather only) vs Experiment B (weather + pest history).",
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
        title="Model Analytics"
        description="Jassid prediction model performance — Experiment A (weather-only features) vs Experiment B (weather + Jassid lag history)."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Model performance" icon="monitoring" className="lg:col-span-2">
          {/* Experiment A group */}
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Experiment A — Weather-only features
          </p>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            {modelPerformance.slice(0, 2).map((m) => (
              <div key={m.model} className="rounded-xl border border-border p-4">
                <p className="font-medium">{m.model}</p>
                <p className="text-xs text-muted-foreground">F1: {(m.f1 * 100).toFixed(1)}%</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                  <DataRow label="Accuracy" value={`${Math.round(m.accuracy * 1000) / 10}%`} />
                  <DataRow label="Precision" value={`${Math.round(m.precision * 1000) / 10}%`} />
                  <DataRow label="Recall" value={`${Math.round(m.recall * 1000) / 10}%`} />
                </div>
              </div>
            ))}
          </div>

          {/* Experiment B group */}
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Experiment B — Weather + Pest history (jassid_lag_1, jassid_lag_2)
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {modelPerformance.slice(2).map((m) => (
              <div key={m.model} className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="font-medium">{m.model}</p>
                <p className="text-xs text-muted-foreground">F1: {(m.f1 * 100).toFixed(1)}%</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                  <DataRow label="Accuracy" value={`${Math.round(m.accuracy * 1000) / 10}%`} />
                  <DataRow label="Precision" value={`${Math.round(m.precision * 1000) / 10}%`} />
                  <DataRow label="Recall" value={`${Math.round(m.recall * 1000) / 10}%`} />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-foreground/60 italic">
            Experiment B models consistently outperform Experiment A, demonstrating that historical
            Jassid population data (lag features) improves next-week risk prediction beyond
            weather inputs alone.
          </p>
        </Panel>

        <Panel title="Datasets" icon="database" className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            {datasets.map((d) => (
              <div key={d.name} className="rounded-xl border border-border p-4">
                <p className="font-medium font-mono text-sm">{d.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {d.rows} rows · {d.source}
                </p>
                <p className="mt-2 text-sm text-foreground/70">{d.purpose}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
