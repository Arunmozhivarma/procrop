import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { predictions } from "@/lib/procrop-data";

export const Route = createFileRoute("/_app/explain")({
  head: () => ({
    meta: [
      { title: "SHAP Explainability — ProCrop" },
      {
        name: "description",
        content:
          "SHAP feature attributions explaining why each next-week Jassid risk prediction was made.",
      },
      { property: "og:title", content: "SHAP Explainability — ProCrop" },
      {
        property: "og:description",
        content:
          "SHAP feature attributions explaining why each next-week Jassid risk prediction was made.",
      },
    ],
  }),
  component: ExplainPage,
});

// Experiment label per prediction
const experimentLabel: Record<string, string> = {
  "pred-j037": "Experiment B — Weather + Pest history (RF + XGBoost Ensemble)",
  "pred-j033": "Experiment B — Weather + Pest history (Random Forest)",
  "pred-j029": "Experiment B — Weather + Pest history (XGBoost)",
};

const experimentNote: Record<string, string> = {
  "pred-j037":
    "Both Jassid lag features appear in the top-3 SHAP contributors, confirming that pest history improves prediction beyond weather alone.",
  "pred-j033":
    "Rainfall and sunshine hours dominate — low rainfall and overcast conditions suppressed Jassid population this week.",
  "pred-j029":
    "Sunshine hours and temperature drive upward risk despite lag counts still below threshold.",
};

function ExplainPage() {
  return (
    <div className="px-5 py-8 md:px-8">
      <PageHeader
        eyebrow="Predict"
        title="SHAP Explainability"
        description="SHAP feature attributions explaining why each next-week Jassid risk prediction was made. Positive values push toward HIGH risk; negative toward LOW."
      />

      {/* Experiment A vs B context */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
          <p className="font-semibold text-foreground">Experiment A — Weather only</p>
          <p className="mt-1 text-foreground/70">
            Features: max_temp, min_temp, mean_temp, RH morning, RH evening, mean_RH, rainfall_mm,
            rainy_days, wind_speed, sunshine_hours + their lag_1 counterparts.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-primary/5 p-4 text-sm">
          <p className="font-semibold text-foreground">Experiment B — Weather + Pest history</p>
          <p className="mt-1 text-foreground/70">
            All Experiment A features{" "}
            <span className="font-semibold">plus jassid_lag_1 and jassid_lag_2</span>. These
            typically rank as the strongest SHAP contributors when population is trending.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {predictions.map((p) => (
          <Panel
            key={p.id}
            title={`Why: ${p.headline}`}
            subtitle={`${experimentLabel[p.id] ?? p.model} · ${p.fieldName}`}
            icon="psychology"
          >
            <ul className="space-y-2 text-sm">
              {p.contributions.map((c) => (
                <li
                  key={c.feature}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                >
                  <span>
                    {c.feature} —{" "}
                    <span className="text-muted-foreground">{c.value}</span>
                  </span>
                  <Tag>
                    {c.impact >= 0 ? "+" : ""}
                    {c.impact.toFixed(2)}
                  </Tag>
                </li>
              ))}
            </ul>
            {experimentNote[p.id] ? (
              <p className="mt-3 text-xs text-foreground/60 italic">{experimentNote[p.id]}</p>
            ) : null}
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
