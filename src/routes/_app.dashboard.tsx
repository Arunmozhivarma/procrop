import { createFileRoute, Link } from "@tanstack/react-router";
import { ErrorState, LoadingBlock, PageHeader, Panel } from "@/components/procrop/ui";
import { errorMessage } from "@/services/api";
import { useDatasetSummary, useLatestObservation, useRecentPredictions } from "@/services/queries";
import { formatDateTime } from "@/utils/formatters";
import { toDisplayName } from "@/utils/columnNames";

export const Route = createFileRoute("/_app/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const summary = useDatasetSummary();
  const latest = useLatestObservation();
  const predictions = useRecentPredictions(10);

  // Calculate dashboard metrics
  const totalPredictions = predictions.data?.length || 0;
  const highRiskCount = predictions.data?.filter(p => p.risk === "HIGH").length || 0;
  const latestPrediction = predictions.data?.[0];
  const latestJassidCount = latest.data?.jassid_per_3_leaves ?? "—";

  return <div className="space-y-6 px-5 py-8 md:px-8">
    <PageHeader
      title="Jassid Risk Dashboard"
      description="Overview of pest risk predictions and field observations"
    />

    {/* Summary Metrics */}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Total Predictions"
        value={totalPredictions}
        icon="analytics"
        color="blue"
      />
      <MetricCard
        label="High Risk Alerts"
        value={highRiskCount}
        icon="warning"
        color="red"
      />
      <MetricCard
        label="Latest Jassid Count"
        value={`${latestJassidCount} / 3l`}
        icon="bug_report"
        color="green"
      />
    </div>

    {/* Quick Actions */}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <QuickAction
        label="Run Prediction"
        icon="play_arrow"
        to="/risk"
        description="Upload leaf photo"
      />
      <QuickAction
        label="View Recommendations"
        icon="checklist"
        to="/recommendations"
        description="Management advice"
      />
      <QuickAction
        label="Risk History"
        icon="history"
        to="/risk"
        description="Past predictions"
      />
      <QuickAction
        label="Analytics"
        icon="insights"
        to="/analytics"
        description="Data insights"
      />
    </div>

    {/* Main Content Grid */}
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Latest Observation */}
      <Panel title="Latest Weekly Observation" icon="table_chart">
        {latest.isPending ? (
          <LoadingBlock label="Loading latest observation…" />
        ) : latest.isError ? (
          <ErrorState message={errorMessage(latest.error)} onRetry={() => latest.refetch()} />
        ) : latest.data ? (
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Jassid Count</p>
                <p className="text-lg font-bold text-foreground">{latest.data.jassid_per_3_leaves} / 3 leaves</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">SMW</p>
                <p className="text-lg font-bold text-foreground">{latest.data.smw ?? "—"}</p>
              </div>
            </div>
            <div className="space-y-1 pt-2">
              {Object.entries(latest.data)
                .filter(([k]) => !["id", "source", "jassid_per_3_leaves", "smw"].includes(k))
                .slice(0, 6)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-border/50 py-1.5">
                    <span className="text-muted-foreground text-xs">{toDisplayName(k)}</span>
                    <strong className="text-xs">{String(v ?? "—")}</strong>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No weekly observations in SQLite yet.</p>
        )}
      </Panel>

      {/* Recent Predictions */}
      <Panel title="Recent Predictions" icon="analytics">
        {predictions.isPending ? (
          <LoadingBlock label="Loading saved predictions…" />
        ) : predictions.isError ? (
          <ErrorState message={errorMessage(predictions.error)} onRetry={() => predictions.refetch()} />
        ) : predictions.data.length ? (
          <div className="space-y-2">
            {predictions.data.slice(0, 5).map((p) => (
              <div key={p.id} className="rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      p.risk === "HIGH" ? "bg-risk-high/15 text-risk-high" : "bg-risk-low/15 text-risk-low"
                    }`}>
                      {p.risk}
                    </span>
                    <span className="text-xs text-muted-foreground">#{p.id}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDateTime(p.created_at)}</span>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Predicted: {p.predicted_next_week_jassid} / 3 leaves
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">{p.image_name}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No predictions saved in SQLite yet.</p>
        )}
      </Panel>
    </div>
  </div>;
}

function MetricCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    red: "bg-risk-high/15 text-risk-high border-risk-high/30",
    green: "bg-green-500/10 text-green-600 border-green-500/20",
    purple: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <span className="material-symbols-outlined text-lg">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function QuickAction({ label, icon, to, description }: { label: string; icon: string; to: string; description: string }) {
  return (
    <Link to={to} className="block">
      <div className="rounded-xl border border-border bg-card p-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
          <div>
            <p className="font-semibold text-foreground text-sm">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>; }
