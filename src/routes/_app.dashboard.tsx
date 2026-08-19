import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { DataRow, RangeBar, RiskBadge, ScoreRing } from "@/components/procrop/ui";
import { alerts, fields, formatDateTime, platformScores, recommendations, riskFromScore } from "@/lib/procrop-data";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ProCrop" },
      { name: "description", content: "Farm-wide health score, live risk signals and the actions that matter today." },
      { property: "og:title", content: "Dashboard — ProCrop" },
      { property: "og:description", content: "Farm-wide health score, live risk signals and the actions that matter today." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="px-5 py-8 md:px-8">
      <PageHeader eyebrow="Monitor" title="Dashboard" description="Farm-wide health score, live risk signals and the actions that matter today." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Platform health" icon="readiness_score">
          <div className="flex items-center gap-6">
            <ScoreRing value={platformScores.overall} level={riskFromScore(platformScores.overall)} label="Health" />
            <div className="space-y-2 text-sm">
              <DataRow label="Soil" value={platformScores.soil} />
              <DataRow label="Environment" value={platformScores.environment} />
              <DataRow label="Fields monitored" value={fields.length} />
            </div>
          </div>
        </Panel>
        <Panel title="Field scores" icon="agriculture" className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.id} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{f.name}</p>
                  <RiskBadge level={riskFromScore(f.healthScore)} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {f.crop} · {f.growthStage} · {f.areaHa} ha
                </p>
                <div className="mt-3"><RangeBar value={f.healthScore} range={[0, 100]} ideal={[70, 100]} /></div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Priority actions" icon="checklist" className="lg:col-span-2">
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
