import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { fetchDatasetSummary, type DatasetSummary } from "@/services/api";

export const Route = createFileRoute("/_app/analytics")({ component: AnalyticsPage });

function AnalyticsPage() {
  const [data, setData] = useState<DatasetSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetchDatasetSummary().then(setData).catch((e) => setError(e.message)); }, []);
  return <div className="space-y-6 px-5 py-8 md:px-8">
    <PageHeader eyebrow="Database" title="Dataset Analytics" description="Counts and recent records read directly from weekly_observations in SQLite." />
    <Panel title="weekly_observations" icon="database">
      {error ? <p role="alert" className="text-destructive">{error}</p> : !data ? <p>Loading database summary…</p> : <>
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Rows" value={data.total_rows} />
          <Metric label="Database columns" value={data.columns_count} />
          <Metric label="Years covered" value={data.years_covered.join(", ") || "—"} />
        </div>
        <h3 className="mt-6 font-semibold">Database columns</h3>
        <div className="mt-2 flex flex-wrap gap-2">{data.columns.map((c) => <code key={c} className="rounded bg-muted px-2 py-1 text-xs">{c}</code>)}</div>
        <h3 className="mt-6 font-semibold">Latest observations</h3>
        {!data.sample_records.length ? <p className="mt-2 text-sm text-muted-foreground">No rows are stored in weekly_observations.</p> : <div className="mt-2 overflow-auto"><table className="min-w-full text-left text-xs"><thead><tr>{data.columns.map((c) => <th key={c} className="px-2 py-2">{c}</th>)}</tr></thead><tbody>{data.sample_records.map((row, i) => <tr key={String(row.id ?? i)} className="border-t">{data.columns.map((c) => <td key={c} className="whitespace-nowrap px-2 py-2">{String(row[c] ?? "—")}</td>)}</tr>)}</tbody></table></div>}
      </>}
    </Panel>
  </div>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>;
}
