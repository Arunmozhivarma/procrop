import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { RiskBadge } from "@/components/procrop/ui";
import { predictions, riskFromProbability } from "@/lib/procrop-data";

export const Route = createFileRoute("/_app/risk")({
  head: () => ({
    meta: [
      { title: "Risk engine — ProCrop" },
      {
        name: "description",
        content: "Disease and pest risk predictions from the Random Forest and XGBoost ensemble.",
      },
      { property: "og:title", content: "Risk engine — ProCrop" },
      {
        property: "og:description",
        content: "Disease and pest risk predictions from the Random Forest and XGBoost ensemble.",
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
        title="Risk engine"
        description="Disease and pest risk predictions from the Random Forest and XGBoost ensemble."
      />
      <div className="space-y-4">
        {predictions.map((p) => (
          <Panel
            key={p.id}
            title={p.headline}
            subtitle={`${p.fieldName} · ${p.model} · ${Math.round(p.diseaseRisk * 100)}% disease risk`}
            icon="readiness_score"
          >
            <div className="flex flex-wrap items-center gap-3">
              <RiskBadge level={riskFromProbability(p.diseaseRisk)} />
              <Tag>Confidence {Math.round(p.confidence * 100)}%</Tag>
            </div>
            <p className="mt-3 text-sm text-foreground/70">{p.narrative}</p>
            <div className="mt-4 space-y-2">
              {p.contributions.map((c) => (
                <div key={c.feature} className="flex items-center gap-3 text-sm">
                  <span className="w-44 shrink-0 text-foreground/70">{c.feature}</span>
                  <span className="w-24 shrink-0 text-xs text-muted-foreground">{c.value}</span>
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
