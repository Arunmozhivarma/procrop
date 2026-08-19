import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { StatTile } from "@/components/procrop/ui";
import { environment, forecast } from "@/lib/procrop-data";

export const Route = createFileRoute("/_app/environment")({
  head: () => ({
    meta: [
      { title: "Environment — ProCrop" },
      { name: "description", content: "Temperature, humidity, rainfall and leaf wetness with the 5-day outlook." },
      { property: "og:title", content: "Environment — ProCrop" },
      { property: "og:description", content: "Temperature, humidity, rainfall and leaf wetness with the 5-day outlook." },
    ],
  }),
  component: EnvironmentPage,
});

function EnvironmentPage() {
  return (
    <div className="px-5 py-8 md:px-8">
      <PageHeader eyebrow="Sense" title="Environment" description="Temperature, humidity, rainfall and leaf wetness with the 5-day outlook." />
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {environment.map((e) => (
            <StatTile key={e.key} icon={e.icon} label={e.label} value={`${e.value}${e.unit}`} hint={`Ideal ${e.ideal[0]}–${e.ideal[1]}${e.unit}`} />
          ))}
        </div>
        <Panel title="5-day forecast" icon="cloud">
          <div className="grid gap-3 sm:grid-cols-5">
            {forecast.map((d) => (
              <div key={d.day} className="rounded-xl border border-border p-4 text-center">
                <p className="text-sm font-semibold">{d.day}</p>
                <p className="mt-2 text-2xl font-display">{d.tempHi}°</p>
                <p className="text-xs text-muted-foreground">{d.humidity}% RH · {d.rain} mm</p>
                <p className="mt-2 text-xs text-foreground/70">{d.risk} risk</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
