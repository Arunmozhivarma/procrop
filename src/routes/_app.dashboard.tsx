import { createFileRoute, Link } from "@tanstack/react-router";
import { ErrorState, LoadingBlock, PageHeader, Panel } from "@/components/procrop/ui";
import { errorMessage } from "@/services/api";
import { useDatasetSummary, useLatestObservation, useRecentPredictions } from "@/services/queries";

export const Route = createFileRoute("/_app/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const summary = useDatasetSummary();
  const latest = useLatestObservation();
  const predictions = useRecentPredictions(5);
  const metric = (value: string | number | undefined) => (summary.isPending ? "…" : (value ?? "—"));
  return <div className="space-y-6 px-5 py-8 md:px-8">
    <PageHeader eyebrow="SQLite · Live records" title="Jassid Risk Dashboard" description="Historical observations and saved predictions loaded from the application database." actions={<Link to="/risk" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Run prediction</Link>} />
    {summary.isError ? <ErrorState title="Could not load the database summary" message={errorMessage(summary.error)} onRetry={() => summary.refetch()} /> : <div className="grid gap-4 sm:grid-cols-3">
      <Metric label="Observation rows" value={metric(summary.data?.total_rows)} />
      <Metric label="Database columns" value={metric(summary.data?.columns_count)} />
      <Metric label="Years in database" value={metric(summary.data?.years_covered.join(", ") || undefined)} />
    </div>}
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Latest weekly observation" icon="table_chart">
        {latest.isPending ? <LoadingBlock label="Loading latest observation…" /> : latest.isError ? <ErrorState message={errorMessage(latest.error)} onRetry={() => latest.refetch()} /> : latest.data ? <div className="space-y-1 text-sm">{Object.entries(latest.data).filter(([k]) => k !== "source").map(([k,v]) => <div key={k} className="flex justify-between gap-4 border-b py-2"><span className="text-muted-foreground">{k}</span><strong>{String(v ?? "—")}</strong></div>)}</div> : <p className="text-sm text-muted-foreground">No weekly observations in SQLite yet.</p>}
      </Panel>
      <Panel title="Recent saved predictions" icon="analytics">
        {predictions.isPending ? <LoadingBlock label="Loading saved predictions…" /> : predictions.isError ? <ErrorState message={errorMessage(predictions.error)} onRetry={() => predictions.refetch()} /> : predictions.data.length ? <div className="space-y-3">{predictions.data.map((p) => <div key={p.id} className="rounded-lg border p-3 text-sm"><div className="flex justify-between"><strong>{p.risk} risk</strong><span>#{p.id}</span></div><p>Predicted count: {p.predicted_next_week_jassid} / 3 leaves</p><p className="text-xs text-muted-foreground">{p.created_at} · {p.model_used}</p></div>)}</div> : <p className="text-sm text-muted-foreground">No predictions saved in SQLite yet.</p>}
      </Panel>
    </div>
  </div>;
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>; }
