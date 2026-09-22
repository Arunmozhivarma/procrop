import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { StatTile } from "@/components/procrop/ui";
import { environment, forecast } from "@/lib/procrop-data";

export const Route = createFileRoute("/_app/environment")({
  head: () => ({
    meta: [
      { title: "Weather Inputs — ProCrop" },
      {
        name: "description",
        content:
          "Current-week and previous-week weather features used as ML model inputs for Jassid risk prediction.",
      },
      { property: "og:title", content: "Weather Inputs — ProCrop" },
      {
        property: "og:description",
        content:
          "Current-week and previous-week weather features used as ML model inputs for Jassid risk prediction.",
      },
    ],
  }),
  component: EnvironmentPage,
});

function EnvironmentPage() {
  return (
    <div className="px-5 py-8 md:px-8">
      <PageHeader
        eyebrow="Sense"
        title="Weather Inputs — Coimbatore"
        description="Current-week weather feature values (SMW 37) used as inputs to the Jassid risk prediction models. Previous-week values form the lag_1 feature set."
      />
      <div className="space-y-6">
        {/* Current-week feature tiles */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Current week (SMW 37) — model input features
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {environment.map((e) => (
              <StatTile
                key={e.key}
                icon={e.icon}
                label={e.label}
                value={`${e.value}${e.unit}`}
                hint={`Ideal ${e.ideal[0]}–${e.ideal[1]}${e.unit}`}
              />
            ))}
          </div>
        </div>

        {/* Derived features note */}
        <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-foreground/70">
          <span className="font-semibold text-foreground">Derived features: </span>
          <span className="font-mono">mean_temp_c</span> = (max_temp + min_temp) / 2 ={" "}
          <strong>29.2 °C</strong>. <span className="font-mono">mean_rh_pct</span> = (RH morning +
          RH evening) / 2 = <strong>70%</strong>. These computed columns are passed to the model
          alongside the raw weather inputs.
        </div>

        {/* SMW outlook */}
        <Panel title="SMW Jassid risk outlook (SMW 38–44)" icon="cloud">
          <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {forecast.map((d) => (
              <div key={d.day} className="rounded-xl border border-border p-4 text-center">
                <p className="text-xs font-semibold">{d.day}</p>
                <p className="mt-2 font-display text-lg">{d.tempHi}°</p>
                <p className="text-xs text-muted-foreground">
                  {d.humidity}% RH · {d.rain} mm
                </p>
                <p
                  className={`mt-2 text-xs font-semibold ${
                    d.risk === "critical" || d.risk === "high"
                      ? "text-risk-high"
                      : d.risk === "moderate"
                        ? "text-risk-moderate"
                        : "text-risk-low"
                  }`}
                >
                  {d.risk.toUpperCase()}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-foreground/60 italic">
            Risk outlook based on modelled weather inputs. Actual Jassid counts will update the lag
            features each SMW.
          </p>
        </Panel>
      </div>
    </div>
  );
}
