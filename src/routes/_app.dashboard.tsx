import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { fetchDatasetSummary, fetchPreviousWeekData, fetchRecentPredictions, type DatasetSummary, type PreviousWeekData, type SavedPredictionRecord } from "@/services/api";

export const Route = createFileRoute("/_app/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [latest, setLatest] = useState<PreviousWeekData | null>(null);
  const [predictions, setPredictions] = useState<SavedPredictionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    Promise.all([fetchDatasetSummary(), fetchPreviousWeekData().catch(() => null), fetchRecentPredictions(5)])
      .then(([s, l, p]) => { setSummary(s); setLatest(l); setPredictions(p); })
      .catch((e) => setError(e.message));
  }, []);
  return <div className="space-y-6 px-5 py-8 md:px-8">
    <PageHeader eyebrow="SQLite · Live records" title="Jassid Risk Dashboard" description="Historical observations and saved predictions loaded from the application database." actions={<Link to="/risk" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Run prediction</Link>} />
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <div className="grid gap-4 sm:grid-cols-3">
      <Metric label="Observation rows" value={summary?.total_rows ?? "—"} />
      <Metric label="Database columns" value={summary?.columns_count ?? "—"} />
      <Metric label="Years in database" value={summary?.years_covered.join(", ") || "—"} />
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Latest weekly observation" icon="table_chart">
        {latest ? <div className="space-y-1 text-sm">{Object.entries(latest).filter(([k]) => k !== "source").map(([k,v]) => <div key={k} className="flex justify-between gap-4 border-b py-2"><span className="text-muted-foreground">{k}</span><strong>{String(v ?? "—")}</strong></div>)}</div> : <p className="text-sm text-muted-foreground">No weekly observations in SQLite yet.</p>}
      </Panel>
      <Panel title="Recent saved predictions" icon="analytics">
        {predictions.length ? <div className="space-y-3">{predictions.map((p) => <div key={p.id} className="rounded-lg border p-3 text-sm"><div className="flex justify-between"><strong>{p.risk} risk</strong><span>#{p.id}</span></div><p>Predicted count: {p.predicted_next_week_jassid} / 3 leaves</p><p className="text-xs text-muted-foreground">{p.created_at} · {p.model_used}</p></div>)}</div> : <p className="text-sm text-muted-foreground">No predictions saved in SQLite yet.</p>}
      </Panel>
    </div>
  </div>;
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>; }
