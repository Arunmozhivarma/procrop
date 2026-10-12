import { createFileRoute } from "@tanstack/react-router";
import { ErrorState, LoadingBlock, PageHeader, Panel } from "@/components/procrop/ui";
import { errorMessage } from "@/services/api";
import { useRecentPredictions } from "@/services/queries";
import { formatDateTime } from "@/utils/formatters";
import { toDisplayName } from "@/utils/columnNames";

export const Route = createFileRoute("/_app/explain")({ component: ExplainPage });

function ExplainPage() {
  const { data: rows, isPending, isError, error, refetch } = useRecentPredictions(50);
  return <div className="space-y-6 px-5 py-8 md:px-8">
    <PageHeader
      title="Prediction Explanations"
      description="Understand what factors influenced each risk prediction and how they contributed to the model's decision."
    />

    {isPending ? (
      <LoadingBlock label="Loading saved explanations…" />
    ) : isError ? (
      <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
    ) : !rows.length ? (
      <Panel title="No saved explanations" icon="psychology">
        <p className="text-sm text-muted-foreground">Run a database-backed prediction to save and view its explanation.</p>
      </Panel>
    ) : (
      <div className="space-y-6">
        {rows.map((row) => (
          <Panel
            key={row.id}
            title={`${row.risk} Risk Prediction`}
            subtitle={`Prediction #${row.id} · ${formatDateTime(row.created_at)}`}
            icon="psychology"
          >
            <div className="space-y-4">
              {/* Prediction Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Predicted Count</p>
                  <p className="text-lg font-bold text-foreground">{row.predicted_next_week_jassid} / 3 leaves</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Risk Level</p>
                  <p className={`text-lg font-bold ${row.risk === "HIGH" ? "text-risk-high" : "text-risk-low"}`}>
                    {row.risk}
                  </p>
                </div>
              </div>

              {/* Feature Contributions */}
              {row.explanation.length ? (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Feature Contributions</h3>
                  <div className="space-y-2">
                    {row.explanation.map((item) => (
                      <FeatureExplanation key={item.feature} item={item} />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No explanation values were saved for this prediction.</p>
              )}
            </div>
          </Panel>
        ))}
      </div>
    )}
  </div>;
}

function FeatureExplanation({ item }: { item: { feature: string; value?: number | null; contribution: number } }) {
  const isPositive = item.contribution >= 0;
  const magnitude = Math.abs(item.contribution);
  const impactLevel = magnitude > 0.5 ? "High" : magnitude > 0.2 ? "Medium" : "Low";

  const featureExplanation = getFeatureExplanation(item.feature, item.value);
  const impactExplanation = getImpactExplanation(item.feature, isPositive, item.value);

  return (
    <div className={`rounded-lg border p-4 ${isPositive ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-foreground text-sm">{toDisplayName(item.feature)}</span>
            {item.value != null && (
              <span className="text-xs text-muted-foreground">({item.value})</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{featureExplanation}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-lg font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}>
            {isPositive ? "+" : ""}{item.contribution.toFixed(3)}
          </p>
          <p className={`text-[10px] uppercase font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}>
            {impactLevel} Impact
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
        <strong>Effect:</strong> {impactExplanation}
      </p>
    </div>
  );
}

function getFeatureExplanation(feature: string, value?: number | null): string {
  const explanations: Record<string, string> = {
    "jassid_per_3_leaves": "Current pest count detected from leaf image or field observation. Higher counts indicate existing infestation.",
    "jassid_lag_1": "Jassid count from previous week. Shows recent population trend and breeding momentum.",
    "jassid_lag_2": "Jassid count from two weeks ago. Provides historical context for population dynamics.",
    "max_temp_c": "Maximum daily temperature. Affects pest reproduction rate and development speed.",
    "min_temp_c": "Minimum daily temperature. Influences pest survival during cooler periods.",
    "rh_morning_pct": "Morning relative humidity. High humidity favors pest breeding and leaf moisture.",
    "rh_evening_pct": "Evening relative humidity. Affects overnight pest activity and survival.",
    "rainfall_mm": "Total rainfall. Can wash away pests but also creates favorable breeding conditions.",
    "rainy_days": "Number of rainy days. Extended wet periods can increase pest populations.",
    "wind_speed_kmh": "Wind speed. Strong winds can disperse pests to new areas.",
    "sunshine_hours": "Daily sunshine duration. Affects plant health and pest feeding patterns.",
    "mean_temp_c": "Average daily temperature. Overall thermal condition for pest development.",
    "mean_rh_pct": "Average relative humidity. General moisture conditions affecting pest habitat.",
    "max_temp_c_lag_1": "Previous week's maximum temperature. Historical thermal conditions.",
    "min_temp_c_lag_1": "Previous week's minimum temperature. Historical thermal conditions.",
    "rh_morning_pct_lag_1": "Previous week's morning humidity. Historical moisture conditions.",
    "rh_evening_pct_lag_1": "Previous week's evening humidity. Historical moisture conditions.",
    "rainfall_mm_lag_1": "Previous week's rainfall. Historical precipitation data.",
    "rainy_days_lag_1": "Previous week's rainy days. Historical wet period data.",
    "wind_speed_kmh_lag_1": "Previous week's wind speed. Historical wind conditions.",
    "sunshine_hours_lag_1": "Previous week's sunshine hours. Historical solar radiation data.",
  };

  return explanations[feature] || "Feature contributing to prediction model.";
}

function getImpactExplanation(feature: string, isPositive: boolean, value?: number | null): string {
  if (feature.includes("jassid")) {
    return isPositive
      ? "Higher pest count increases predicted risk for next week."
      : "Lower pest count reduces predicted risk for next week.";
  }
  if (feature.includes("temp")) {
    return isPositive
      ? "Warmer temperatures accelerate pest reproduction and development."
      : "Cooler temperatures slow down pest breeding cycles.";
  }
  if (feature.includes("rh") || feature.includes("humidity")) {
    return isPositive
      ? "Higher humidity creates favorable conditions for pest breeding and survival."
      : "Lower humidity reduces pest survival and reproduction rates.";
  }
  if (feature.includes("rain")) {
    return isPositive
      ? "More rainfall can increase breeding sites and pest populations."
      : "Less rainfall may limit pest breeding opportunities.";
  }
  if (feature.includes("wind")) {
    return isPositive
      ? "Stronger winds can spread pests to new areas, increasing risk."
      : "Lower wind speeds reduce pest dispersal to new locations.";
  }
  if (feature.includes("sunshine")) {
    return isPositive
      ? "More sunshine can increase pest feeding activity."
      : "Less sunshine may reduce pest activity levels.";
  }
  return isPositive
    ? "This factor increases the predicted Jassid count for next week."
    : "This factor decreases the predicted Jassid count for next week.";
}
