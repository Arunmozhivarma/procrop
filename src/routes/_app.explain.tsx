import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { fetchRecentPredictions, type SavedPredictionRecord } from "@/services/api";

export const Route = createFileRoute("/_app/explain")({ component: ExplainPage });

function ExplainPage() {
  const [rows, setRows] = useState<SavedPredictionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetchRecentPredictions(50).then(setRows).catch((e) => setError(e.message)); }, []);
  return <div className="space-y-4 px-5 py-8 md:px-8">
    <PageHeader eyebrow="Database" title="Prediction Explanations" description="Stored SHAP feature contributions from SQLite predictions records." />
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {!rows.length && !error && <Panel title="No saved explanations" icon="psychology"><p className="text-sm text-muted-foreground">Run a database-backed prediction to save and view its explanation.</p></Panel>}
    {rows.map((row) => <Panel key={row.id} title={`${row.risk} risk · ${row.predicted_next_week_jassid} Jassids / 3 leaves`} subtitle={`Prediction #${row.id} · ${row.created_at} · ${row.model_used}`} icon="psychology">
      {row.explanation?.length ? <ul className="space-y-2">{row.explanation.map((item) => <li key={item.feature} className="flex justify-between rounded-lg border p-3 text-sm"><span>{item.feature}{item.value !== undefined ? ` (${item.value})` : ""}</span><strong>{item.contribution >= 0 ? "+" : ""}{item.contribution.toFixed(3)}</strong></li>)}</ul> : <p className="text-sm text-muted-foreground">No explanation values were saved for this prediction.</p>}
    </Panel>)}
  </div>;
}
