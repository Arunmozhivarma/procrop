import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { DataRow } from "@/components/procrop/ui";
import { crops } from "@/lib/procrop-data";

export const Route = createFileRoute("/_app/crops")({
  head: () => ({
    meta: [
      { title: "Crops — ProCrop" },
      { name: "description", content: "Crop profiles, growth stages and the diseases and pests each stage attracts." },
      { property: "og:title", content: "Crops — ProCrop" },
      { property: "og:description", content: "Crop profiles, growth stages and the diseases and pests each stage attracts." },
    ],
  }),
  component: CropsPage,
});

function CropsPage() {
  return (
    <div className="px-5 py-8 md:px-8">
      <PageHeader eyebrow="Monitor" title="Crops" description="Crop profiles, growth stages and the diseases and pests each stage attracts." />
      <div className="grid gap-4 lg:grid-cols-2">
        {crops.map((c) => (
          <Panel key={c.id} title={`${c.name} — ${c.variety}`} subtitle={`${c.season} · ${c.durationDays} days`} icon="potted_plant">
            <div className="space-y-2">
              {c.stages.map((s) => (
                <div key={s.name} className="flex items-start justify-between gap-3 rounded-xl border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{s.name} <span className="text-xs text-muted-foreground">({s.days} d)</span></p>
                    <p className="text-xs text-foreground/70">{s.risks.join(", ") || "No major risks"}</p>
                  </div>
                  <Tag>{s.done ? "Done" : "Upcoming"}</Tag>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <DataRow label="Ideal temp" value={`${c.idealTempC[0]}–${c.idealTempC[1]} °C`} />
              <DataRow label="Ideal moisture" value={`${c.idealMoisture[0]}–${c.idealMoisture[1]}%`} />
              <DataRow label="Ideal pH" value={`${c.idealPh[0]}–${c.idealPh[1]}`} />
              <DataRow label="Common pests" value={c.commonPests.join(", ")} />
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-foreground/70">
      {children}
    </span>
  );
}
