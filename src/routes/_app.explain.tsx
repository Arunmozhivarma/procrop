import { createFileRoute } from "@tanstack/react-router";
import { ErrorState, LoadingBlock, PageHeader, Panel } from "@/components/procrop/ui";
import { errorMessage } from "@/services/api";
import { useRecentPredictions } from "@/services/queries";

export const Route = createFileRoute("/_app/explain")({ component: ExplainPage });

function ExplainPage() {
  const { data: rows, isPending, isError, error, refetch } = useRecentPredictions(50);
  return <div className="space-y-4 px-5 py-8 md:px-8">
    <PageHeader eyebrow="Database" title="Prediction Explanations" description="Stored SHAP feature contributions from SQLite predictions records." />
    {isPending ? <LoadingBlock label="Loading saved explanations…" /> : isError ? <ErrorState message={errorMessage(error)} onRetry={() => refetch()} /> : !rows.length ? <Panel title="No saved explanations" icon="psychology"><p className="text-sm text-muted-foreground">Run a database-backed prediction to save and view its explanation.</p></Panel> : rows.map((row) => <Panel key={row.id} title={`${row.risk} risk · ${row.predicted_next_week_jassid} Jassids / 3 leaves`} subtitle={`Prediction #${row.id} · ${row.created_at} · ${row.model_used}`} icon="psychology">
      {row.explanation.length ? <ul className="space-y-2">{row.explanation.map((item) => <li key={item.feature} className="flex justify-between rounded-lg border p-3 text-sm"><span>{item.feature}{item.value != null ? ` (${item.value})` : ""}</span><strong>{item.contribution >= 0 ? "+" : ""}{item.contribution.toFixed(3)}</strong></li>)}</ul> : <p className="text-sm text-muted-foreground">No explanation values were saved for this prediction.</p>}
    </Panel>)}
  </div>;
}
