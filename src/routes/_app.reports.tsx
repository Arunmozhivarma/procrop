import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { DataRow } from "@/components/procrop/ui";
import { farms, fieldsOfFarm, formatDate } from "@/lib/procrop-data";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({
    meta: [
      { title: "Reports — ProCrop" },
      { name: "description", content: "Exportable season summaries for each farm and field." },
      { property: "og:title", content: "Reports — ProCrop" },
      { property: "og:description", content: "Exportable season summaries for each farm and field." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <div className="px-5 py-8 md:px-8">
      <PageHeader eyebrow="Act" title="Reports" description="Exportable season summaries for each farm and field." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {farms.flatMap((farm) =>
          fieldsOfFarm(farm.id).map((f) => (
            <Panel key={f.id} title={`${f.name} report`} subtitle={`${farm.name} · ${f.crop}`} icon="description">
              <div className="space-y-2 text-sm">
                <DataRow label="Health score" value={f.healthScore} />
                <DataRow label="Soil score" value={f.soilScore} />
                <DataRow label="Disease risk" value={`${Math.round(f.diseaseRisk * 100)}%`} />
                <DataRow label="Pest risk" value={`${Math.round(f.pestRisk * 100)}%`} />
                <DataRow label="Last inspection" value={formatDate(f.lastInspection)} />
              </div>
            </Panel>
          )),
        )}
      </div>
    </div>
  );
}
