import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { DataRow, RangeBar, RiskBadge, ScoreRing } from "@/components/procrop/ui";
import {
  alerts,
  fields,
  formatDateTime,
  platformScores,
  recommendations,
  riskFromScore,
} from "@/lib/procrop-data";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Jassid Risk Dashboard — ProCrop" },
      {
        name: "description",
        content:
          "Next-week Jassid risk prediction for Coimbatore cotton. Current pest score, field health and priority actions.",
      },
      { property: "og:title", content: "Jassid Risk Dashboard — ProCrop" },
      {
        property: "og:description",
        content:
          "Next-week Jassid risk prediction for Coimbatore cotton. Current pest score, field health and priority actions.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="px-5 py-8 md:px-8">
      <PageHeader
        eyebrow="Monitor"
        title="Jassid Risk Dashboard"
        description="Next-week Jassid risk prediction for Coimbatore cotton — current pest score, field health and priority scouting actions."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Jassid pest risk score" icon="readiness_score">
          <div className="flex items-center gap-6">
            <ScoreRing
              value={platformScores.pest}
              level={riskFromScore(100 - platformScores.pest)}
              label="Jassid risk"
            />
            <div className="space-y-2 text-sm">
              <DataRow label="Current count" value="2.1 / 3 leaves" />
              <DataRow label="Threshold" value="≥ 1.95 (experimental)" />
              <DataRow label="Next-week forecast" value="HIGH risk" />
              <DataRow label="Model confidence" value="88%" />
            </div>
          </div>
        </Panel>
        <Panel title="Cotton field health" icon="agriculture" className="lg:col-span-2">
          <div className="grid gap-3">
            {fields.map((f) => (
              <div key={f.id} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{f.name}</p>
                  <RiskBadge level={riskFromScore(f.healthScore)} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {f.crop} · {f.growthStage} · {f.areaHa} ha · Coimbatore
                </p>
                <div className="mt-3">
                  <RangeBar value={f.healthScore} range={[0, 100]} ideal={[70, 100]} />
                </div>
                <p className="mt-2 text-xs text-foreground/70">{f.notes}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Priority scouting actions" icon="checklist" className="lg:col-span-2">
          <ul className="space-y-3">
            {recommendations.slice(0, 4).map((r) => (
              <li key={r.id} className="rounded-xl border border-border p-4">
                <p className="font-medium">{r.title}</p>
                <p className="mt-1 text-sm text-foreground/70">{r.summary}</p>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Recent alerts" icon="notifications">
          <ul className="space-y-3">
            {alerts.slice(0, 5).map((a) => (
              <li key={a.id} className="rounded-xl border border-border p-3">
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(a.createdAt)}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
