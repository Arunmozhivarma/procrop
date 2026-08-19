import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { RangeBar, RiskBadge } from "@/components/procrop/ui";
import { farms, fieldsOfFarm, riskFromScore } from "@/lib/procrop-data";

export const Route = createFileRoute("/_app/farms")({
  head: () => ({
    meta: [
      { title: "Farms & fields — ProCrop" },
      { name: "description", content: "Every farm, its fields, crops and current health status." },
      { property: "og:title", content: "Farms & fields — ProCrop" },
      { property: "og:description", content: "Every farm, its fields, crops and current health status." },
    ],
  }),
  component: FarmsPage,
});

function FarmsPage() {
  return (
    <div className="px-5 py-8 md:px-8">
      <PageHeader eyebrow="Monitor" title="Farms & fields" description="Every farm, its fields, crops and current health status." />
      <div className="space-y-6">
        {farms.map((farm) => (
          <Panel key={farm.id} title={farm.name} subtitle={`${farm.location} · ${farm.totalHa} ha · ${farm.soilType}`} icon="agriculture">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {fieldsOfFarm(farm.id).map((f) => (
                <div key={f.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{f.name}</p>
                    <RiskBadge level={riskFromScore(f.healthScore)} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{f.crop} · {f.variety}</p>
                  <div className="mt-3"><RangeBar value={f.healthScore} range={[0, 100]} ideal={[70, 100]} /></div>
                  <p className="mt-2 text-xs text-foreground/70">{f.notes}</p>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
