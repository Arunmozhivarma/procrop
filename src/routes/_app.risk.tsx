import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { RiskBadge } from "@/components/procrop/ui";
import { predictions, riskFromProbability } from "@/lib/procrop-data";

export const Route = createFileRoute("/_app/risk")({
  head: () => ({
    meta: [
      { title: "Jassid Risk Engine — ProCrop" },
      {
        name: "description",
        content:
          "Next-week Jassid activity predictions using Random Forest and XGBoost on Coimbatore weather and historical pest data.",
      },
      { property: "og:title", content: "Jassid Risk Engine — ProCrop" },
      {
        property: "og:description",
        content:
          "Next-week Jassid activity predictions using Random Forest and XGBoost on Coimbatore weather and historical pest data.",
      },
    ],
  }),
  component: RiskPage,
});

function RiskPage() {
  return (
    <div className="px-5 py-8 md:px-8">
      <PageHeader
        eyebrow="Predict"
        title="Jassid Risk Engine"
        description="Next-week Jassid activity predictions for Coimbatore cotton using Random Forest and XGBoost on weather + historical pest data."
      />

      {/* Threshold disclaimer */}
      <div className="mb-6 rounded-xl border border-border bg-muted/50 p-4 text-sm text-foreground/70">
        <span className="font-semibold text-foreground">Classification note: </span>
        The HIGH / LOW risk threshold of{" "}
        <span className="font-semibold">≥ 1.95 Jassids per 3 leaves</span> is an experimental
        median-derived rule applied to this dataset. It is{" "}
        <span className="font-semibold">not an official ICAR economic threshold level (ETL)</span>.
        Results are for research classification purposes only.
      </div>

      <div className="space-y-4">
        {predictions.map((p) => (
          <Panel
            key={p.id}
            title={p.headline}
            subtitle={`${p.fieldName} · ${p.model} · Jassid pest risk ${Math.round(p.pestRisk * 100)}%`}
            icon="readiness_score"
          >
            <div className="flex flex-wrap items-center gap-3">
              <RiskBadge level={riskFromProbability(p.pestRisk)} />
              <Tag>Confidence {Math.round(p.confidence * 100)}%</Tag>
              <Tag>
                {p.pestRisk >= 0.5
                  ? "HIGH — ≥ 1.95 Jassids / 3 leaves"
                  : "LOW — < 1.95 Jassids / 3 leaves"}
              </Tag>
            </div>
            <p className="mt-3 text-sm text-foreground/70">{p.narrative}</p>
            <p className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              SHAP feature contributions
            </p>
            <div className="space-y-2">
              {p.contributions.map((c) => (
                <div key={c.feature} className="flex items-center gap-3 text-sm">
                  <span className="w-52 shrink-0 text-foreground/70">{c.feature}</span>
                  <span className="w-28 shrink-0 text-xs text-muted-foreground">{c.value}</span>
                  <span className="h-2 flex-1 rounded-full bg-muted">
                    <span
                      className={
                        c.impact >= 0
                          ? "block h-2 rounded-full bg-risk-high"
                          : "block h-2 rounded-full bg-risk-low"
                      }
                      style={{ width: `${Math.min(100, Math.abs(c.impact) * 200)}%` }}
                    />
                  </span>
                  <span
                    className={`w-12 shrink-0 text-right text-xs font-semibold ${
                      c.impact >= 0 ? "text-risk-high" : "text-risk-low"
                    }`}
                  >
                    {c.impact >= 0 ? "+" : ""}
                    {c.impact.toFixed(2)}
                  </span>
                </div>
              ))}
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
