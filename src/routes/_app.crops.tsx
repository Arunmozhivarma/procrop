import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { DataRow } from "@/components/procrop/ui";
import { crops } from "@/lib/procrop-data";

export const Route = createFileRoute("/_app/crops")({
  head: () => ({
    meta: [
      { title: "Crop Profile — Cotton — ProCrop" },
      {
        name: "description",
        content:
          "Cotton growth stages, Jassid pressure windows and ideal conditions for Coimbatore Kharif cultivation.",
      },
      { property: "og:title", content: "Crop Profile — Cotton — ProCrop" },
      {
        property: "og:description",
        content:
          "Cotton growth stages, Jassid pressure windows and ideal conditions for Coimbatore Kharif cultivation.",
      },
    ],
  }),
  component: CropsPage,
});

function CropsPage() {
  return (
    <div className="px-5 py-8 md:px-8">
      <PageHeader
        eyebrow="Monitor"
        title="Crop Profile — Cotton"
        description="Growth stages, Jassid pressure windows and ideal agronomic conditions for Coimbatore Kharif cotton."
      />
      <div className="grid gap-4">
        {crops.map((c) => (
          <Panel
            key={c.id}
            title={`${c.name} — ${c.variety}`}
            subtitle={`${c.season} · ${c.durationDays} days · Coimbatore, Tamil Nadu`}
            icon="potted_plant"
          >
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Growth stages &amp; Jassid pressure windows
            </p>
            <div className="space-y-2">
              {c.stages.map((s) => (
                <div
                  key={s.name}
                  className={`flex items-start justify-between gap-3 rounded-xl border p-3 ${
                    s.risks.some((r) => r.toLowerCase().includes("jassid"))
                      ? "border-primary/30 bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">
                      {s.name} <span className="text-xs text-muted-foreground">({s.days})</span>
                    </p>
                    <p className="text-xs text-foreground/70">
                      {s.risks.join(", ") || "No major risks"}
                    </p>
                  </div>
                  <Tag
                    variant={
                      s.risks.some((r) => r.toLowerCase().includes("peak"))
                        ? "alert"
                        : s.done
                          ? "done"
                          : "upcoming"
                    }
                  >
                    {s.done
                      ? "Done"
                      : s.risks.some((r) => r.toLowerCase().includes("peak"))
                        ? "⚠ Peak"
                        : "Upcoming"}
                  </Tag>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
              <DataRow label="Ideal temp" value={`${c.idealTempC[0]}–${c.idealTempC[1]} °C`} />
              <DataRow
                label="Ideal moisture"
                value={`${c.idealMoisture[0]}–${c.idealMoisture[1]}%`}
              />
              <DataRow label="Ideal pH" value={`${c.idealPh[0]}–${c.idealPh[1]}`} />
              <DataRow label="Primary pest" value="Jassid (Amrasca biguttula biguttula)" />
              <DataRow label="Other pests" value={c.commonPests.slice(1).join(", ")} />
              <DataRow label="Jassid threshold" value="≥ 1.95 / 3 leaves (experimental)" />
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function Tag({
  children,
  variant = "upcoming",
}: {
  children: React.ReactNode;
  variant?: "done" | "upcoming" | "alert";
}) {
  const cls =
    variant === "done"
      ? "bg-muted text-muted-foreground"
      : variant === "alert"
        ? "bg-critical/10 text-critical border-critical/30"
        : "bg-muted text-foreground/70";
  return (
    <span
      className={`shrink-0 rounded-full border border-border px-3 py-1 text-xs font-semibold ${cls}`}
    >
      {children}
    </span>
  );
}
