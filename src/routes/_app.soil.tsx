import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { RangeBar } from "@/components/procrop/ui";
import { fields, soilByField } from "@/lib/procrop-data";

export const Route = createFileRoute("/_app/soil")({
  head: () => ({
    meta: [
      { title: "Soil monitoring — ProCrop" },
      {
        name: "description",
        content: "Moisture, pH, nitrogen, phosphorus, potassium and soil temperature per field.",
      },
      { property: "og:title", content: "Soil monitoring — ProCrop" },
      {
        property: "og:description",
        content: "Moisture, pH, nitrogen, phosphorus, potassium and soil temperature per field.",
      },
    ],
  }),
  component: SoilPage,
});

function SoilPage() {
  return (
    <div className="px-5 py-8 md:px-8">
      <PageHeader
        eyebrow="Sense"
        title="Soil monitoring"
        description="Moisture, pH, nitrogen, phosphorus, potassium and soil temperature per field."
      />
      <div className="space-y-6">
        {fields.map((f) => (
          <Panel
            key={f.id}
            title={f.name}
            subtitle={`Soil score ${f.soilScore}/100`}
            icon="landslide"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(soilByField[f.id] ?? []).map((m) => (
                <div key={m.key}>
                  <p className="mb-2 text-sm font-medium">
                    {m.label} — {m.value}
                    {m.unit}
                  </p>
                  <RangeBar value={m.value} ideal={m.ideal} range={m.range} unit={m.unit} />
                  <p className="mt-1 text-xs text-foreground/70">{m.note}</p>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
