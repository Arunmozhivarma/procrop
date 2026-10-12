import { createFileRoute } from "@tanstack/react-router";
import {
  EmptyState,
  LoadingBlock,
  PageHeader,
  Panel,
  RiskBadge,
} from "@/components/procrop/ui";
import { errorMessage } from "@/services/api";
import { useRecentPredictions, useLiveWeather } from "@/services/queries";
import { formatDateTime } from "@/utils/formatters";

export const Route = createFileRoute("/_app/recommendations")({
  head: () => ({
    meta: [
      { title: "Jassid Management Recommendations — ProCrop" },
      {
        name: "description",
        content:
          "Actionable recommendations for Coimbatore cotton based on ML pest predictions and live weather data.",
      },
      { property: "og:title", content: "Jassid Management Recommendations — ProCrop" },
      {
        property: "og:description",
        content:
          "Actionable recommendations for Coimbatore cotton based on ML pest predictions and live weather data.",
      },
    ],
  }),
  component: RecommendationsPage,
});

interface ActionRecommendation {
  id: string;
  category: "Chemical Control" | "Botanical Control" | "Cultural Control" | "Field Scouting";
  title: string;
  prescription: string;
  rationale: string;
  timing: string;
  priority: "High" | "Medium" | "Low";
  status: "Immediate Action" | "Conditional / On Hold" | "Standard Maintenance";
  icon: string;
}

export default function RecommendationsPage() {
  const predictionsQuery = useRecentPredictions(5);
  const weatherQuery = useLiveWeather();
  const predictions = predictionsQuery.data ?? [];
  const weather = weatherQuery.data ?? null;
  const loading = predictionsQuery.isFetching || weatherQuery.isFetching;
  const initialLoading = predictionsQuery.isPending || weatherQuery.isPending;
  const failedQuery = [weatherQuery, predictionsQuery].find((q) => q.isError);
  const error = failedQuery ? errorMessage(failedQuery.error) : null;

  const loadData = () => {
    predictionsQuery.refetch();
    weatherQuery.refetch();
  };

  // Generate recommendations for a specific prediction based on its risk and current weather
  const getRecommendationsForPrediction = (prediction: any): { recommendations: ActionRecommendation[], basis: string } => {
    const list: ActionRecommendation[] = [];
    const predictedCount = prediction.predicted_next_week_jassid;
    const threshold = prediction.risk_threshold || 1.95;
    const riskLevel = prediction.risk;
    const rainfall = weather?.rainfall_mm ?? null;
    const isRainyDay = rainfall !== null && rainfall >= 5.0;
    const isHeavyRain = rainfall !== null && rainfall >= 15.0;
    const windSpeed = weather?.wind_speed_kmh ?? null;
    const isWindy = windSpeed !== null && windSpeed > 12;
    const rhMorning = weather?.rh_morning_pct ?? null;
    const isHighHumidity = rhMorning !== null && rhMorning > 80;

    // Determine risk severity based on predicted count
    let riskSeverity: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
    if (predictedCount >= threshold * 1.5) {
      riskSeverity = "CRITICAL";
    } else if (predictedCount >= threshold) {
      riskSeverity = "HIGH";
    } else if (predictedCount >= threshold * 0.7) {
      riskSeverity = "MODERATE";
    } else {
      riskSeverity = "LOW";
    }

    // Build basis explanation
    const basisParts = [
      `Predicted Jassid count: ${predictedCount} / 3 leaves (threshold: ${threshold})`,
      `Risk severity: ${riskSeverity}`,
      rainfall !== null ? `Current rainfall: ${rainfall} mm${isRainyDay ? " (rainy day)" : ""}` : null,
      windSpeed !== null ? `Wind speed: ${windSpeed} km/h${isWindy ? " (high wind)" : ""}` : null,
      rhMorning !== null ? `Morning humidity: ${rhMorning}%${isHighHumidity ? " (high humidity)" : ""}` : null,
    ].filter(Boolean);

    const basis = basisParts.join(" · ");

    // 1. Chemical Management - Indian context with locally available pesticides
    if (riskSeverity === "CRITICAL" || riskSeverity === "HIGH") {
      if (isHeavyRain) {
        list.push({
          id: `chem-heavy-rain-${prediction.id}`,
          category: "Chemical Control",
          title: "Hold All Sprays - Heavy Rain",
          prescription: "Postpone all insecticide sprays. Heavy rain will wash off chemicals.",
          rationale: `${rainfall}mm rainfall exceeds safe spray limit. Wait for dry conditions.`,
          timing: "Wait 2-3 days after rain stops",
          priority: "High",
          status: "Conditional / On Hold",
          icon: "thunderstorm",
        });
      } else if (isRainyDay) {
        list.push({
          id: `chem-rain-delay-${prediction.id}`,
          category: "Chemical Control",
          title: "Delay Spray - Rain Expected",
          prescription: "Postpone spray until rain stops and leaves dry completely.",
          rationale: `${rainfall}mm rain will wash off spray. Rain itself knocks down nymphs naturally.`,
          timing: "Wait 24-48 hours after rain",
          priority: "High",
          status: "Conditional / On Hold",
          icon: "hourglass_top",
        });
      } else if (isWindy) {
        list.push({
          id: `chem-wind-delay-${prediction.id}`,
          category: "Chemical Control",
          title: "Spray Early Morning - High Wind",
          prescription: "Spray Imidacloprid 17.8 SL or Thiamethoxam 25 WG @ 0.5ml/L during calm hours.",
          rationale: `${windSpeed}km/h wind causes spray drift. Spray 6-8 AM when wind is low.`,
          timing: "Tomorrow 6-8 AM",
          priority: "High",
          status: "Immediate Action",
          icon: "air",
        });
      } else {
        list.push({
          id: `chem-immediate-${prediction.id}`,
          category: "Chemical Control",
          title: riskSeverity === "CRITICAL" ? "Emergency Spray Required" : "ETL Spray Recommended",
          prescription: riskSeverity === "CRITICAL"
            ? "Spray Imidacloprid 17.8 SL @ 0.6ml/L or Acetamiprid 20 SP @ 0.5g/L with sticker."
            : "Spray Imidacloprid 17.8 SL @ 0.5ml/L or Thiamethoxam 25 WG @ 0.5g/L.",
          rationale: `Count ${predictedCount}/3 leaves ${riskSeverity === "CRITICAL" ? "very high" : "above"} threshold (${threshold}). Dry conditions suitable for spraying.`,
          timing: "Within 24-36 hours, calm weather",
          priority: "High",
          status: "Immediate Action",
          icon: "vaccines",
        });
      }
    } else if (riskSeverity === "MODERATE") {
      list.push({
        id: `chem-monitor-${prediction.id}`,
        category: "Chemical Control",
        title: "Monitor - No Spray Yet",
        prescription: "Don't spray. Scout field to check actual pest levels.",
        rationale: `Count ${predictedCount}/3 leaves below threshold. Natural enemies may control pests.`,
        timing: "Re-check in 3-5 days",
        priority: "Medium",
        status: "Conditional / On Hold",
        icon: "visibility",
      });
    } else {
      list.push({
        id: `chem-low-risk-${prediction.id}`,
        category: "Chemical Control",
        title: "No Spray Needed",
        prescription: "No chemical spray required. Conserve natural enemies.",
        rationale: `Count ${predictedCount}/3 leaves well below threshold. Ladybirds and lacewings will control pests.`,
        timing: "Weekly monitoring",
        priority: "Low",
        status: "Standard Maintenance",
        icon: "shield",
      });
    }

    // 2. Botanical - Indian farmers commonly use neem
    if (riskSeverity === "CRITICAL" || riskSeverity === "HIGH") {
      if (!isRainyDay) {
        list.push({
          id: `bio-neem-active-${prediction.id}`,
          category: "Botanical Control",
          title: "Neem Seed Kernel Extract (NSKE) Spray",
          prescription: "Spray 5% NSKE (5kg neem kernel powder in 100L water) with sticker.",
          rationale: "Neem acts as anti-feedant and growth regulator. Safe for beneficial insects.",
          timing: "Evening 4-6 PM",
          priority: "High",
          status: "Immediate Action",
          icon: "eco",
        });
      }
    }

    // 3. Cultural Practices - Simple Indian farming practices
    list.push({
      id: `traps-sticky-${prediction.id}`,
      category: "Cultural Control",
      title: "Yellow Sticky Traps",
      prescription: "Install 10-12 yellow sticky traps per acre, 15cm above canopy.",
      rationale: "Jassids attracted to yellow color. Traps reduce adult population.",
      timing: "Install immediately",
      priority: riskSeverity === "CRITICAL" || riskSeverity === "HIGH" ? "High" : "Medium",
      status: "Immediate Action",
      icon: "wb_incandescent",
    });

    // 4. Field Scouting - Simplified
    const scoutingDays = riskSeverity === "CRITICAL" ? "Daily" : riskSeverity === "HIGH" ? "Every 3 days" : "Weekly";
    list.push({
      id: `scouting-freq-${prediction.id}`,
      category: "Field Scouting",
      title: `Scout Field - ${scoutingDays}`,
      prescription: riskSeverity === "CRITICAL" || riskSeverity === "HIGH"
        ? "Check 20 plants, count nymphs on 3 leaves each (top, middle, bottom)."
        : "Check 10 plants randomly, count nymphs on 3 leaves.",
      rationale: riskSeverity === "CRITICAL" || riskSeverity === "HIGH"
        ? "High risk needs frequent monitoring to prevent damage."
        : "Regular scouting catches pest buildup early.",
      timing: scoutingDays,
      priority: riskSeverity === "CRITICAL" || riskSeverity === "HIGH" ? "High" : "Medium",
      status: "Immediate Action",
      icon: "search_check",
    });

    return { recommendations: list, basis };
  };

  return (
    <div className="px-5 py-8 md:px-8">
      <PageHeader
        title="Jassid Management Recommendations"
        description="Actionable recommendations based on ML predictions and current weather."
      />

      {error && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-semibold">Data Loading Error</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {initialLoading ? (
        <LoadingBlock label="Loading predictions…" />
      ) : !predictionsQuery.isError && predictions.length === 0 ? (
        <EmptyState
          icon="checklist"
          title="No predictions found"
          body="Run a prediction in the Risk engine to generate recommendations."
        />
      ) : (
        <div className="space-y-4">
          {predictions.map((prediction) => {
            const result = weather ? getRecommendationsForPrediction(prediction) : null;
            const recommendations = result?.recommendations ?? [];
            const basis = result?.basis ?? "";
            const isHighRisk = prediction.risk === "HIGH" || prediction.predicted_next_week_jassid >= prediction.risk_threshold;

            return (
              <div key={prediction.id} className="rounded-xl border border-border bg-card p-4">
                {/* Simple Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <RiskBadge level={isHighRisk ? "high" : "low"} />
                    <div>
                      <span className="font-semibold text-foreground">{prediction.predicted_next_week_jassid} / 3 leaves</span>
                      <span className="text-xs text-muted-foreground ml-2">#{prediction.id}</span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDateTime(prediction.created_at)}</span>
                </div>

                {/* Basis - simplified */}
                {basis && (
                  <div className="mb-4 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                    <span className="font-medium">Basis:</span> {basis}
                  </div>
                )}

                {/* Recommendations - simplified list */}
                {!weather ? (
                  <p className="text-sm text-muted-foreground">Weather data required for recommendations.</p>
                ) : recommendations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recommendations available.</p>
                ) : (
                  <div className="space-y-2">
                    {recommendations.map((r: ActionRecommendation) => (
                      <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                        <span className="material-symbols-outlined text-primary mt-0.5">{r.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground text-sm">{r.title}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                r.priority === "High"
                                  ? "bg-risk-high/15 text-risk-high"
                                  : r.priority === "Medium"
                                    ? "bg-risk-moderate/15 text-risk-moderate"
                                    : "bg-risk-low/15 text-risk-low"
                              }`}
                            >
                              {r.priority}
                            </span>
                          </div>
                          <p className="text-xs text-foreground/80 mb-1">{r.prescription}</p>
                          <p className="text-[11px] text-muted-foreground">{r.rationale}</p>
                          <p className="text-[11px] text-primary mt-1">⏱ {r.timing}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
