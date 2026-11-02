import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import {
  EmptyState,
  LoadingBlock,
  PageHeader,
  Panel,
  RiskBadge,
  ScoreRing,
  StatTile,
} from "@/components/procrop/ui";
import { alerts, platformScores, recommendations, riskFromScore } from "@/lib/procrop-data";
import {
  fetchLiveCoimbatoreWeather,
  fetchLatestPrediction,
  LiveWeatherResponse,
  DetailedPredictionResponse,
} from "@/services/api";
import { useRecentPredictions } from "@/services/queries";
import { formatDateTime } from "@/utils/formatters";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Jassid Risk Dashboard — ProCrop" },
      {
        name: "description",
        content:
          "Next-week Cotton Jassid risk prediction for Coimbatore cotton. Real-time surveillance, live weather and priority field actions.",
      },
      { property: "og:title", content: "Jassid Risk Dashboard — ProCrop" },
      {
        property: "og:description",
        content:
          "Next-week Cotton Jassid risk prediction for Coimbatore cotton. Real-time surveillance, live weather and priority field actions.",
      },
    ],
  }),
  component: DashboardPage,
});

function riskBgClass(risk: string) {
  if (risk === "High") return "from-risk-high/10 border-risk-high/30";
  if (risk === "Medium") return "from-risk-moderate/10 border-risk-moderate/30";
  return "from-risk-low/10 border-risk-low/30";
}
function riskTextClass(risk: string) {
  if (risk === "High") return "text-risk-high";
  if (risk === "Medium") return "text-risk-moderate";
  return "text-risk-low";
}

function getRiskLevel(risk: string) {
  if (risk.toLowerCase() === "high") return "high";
  if (risk.toLowerCase() === "medium") return "moderate";
  return "low";
}

function DashboardPage() {
  const [weather, setWeather] = useState<LiveWeatherResponse | null>(null);
  const [latestPred, setLatestPred] = useState<DetailedPredictionResponse | null>(null);
  const [predLoading, setPredLoading] = useState(true);
  const recentPredictions = useRecentPredictions(5);

  useEffect(() => {
    fetchLiveCoimbatoreWeather()
      .then((res) => setWeather(res))
      .catch(() => null);
  }, []);

  useEffect(() => {
    fetchLatestPrediction()
      .then((pred) => setLatestPred(pred))
      .catch(() => null)
      .finally(() => setPredLoading(false));
  }, []);

  const pendingActions = recommendations.filter((r) => r.status === "pending");
  const activeAlerts = alerts.filter((a) => !a.read);

  return (
    <div className="space-y-6 px-5 py-8 md:px-8 max-w-7xl mx-auto">
      {/* Crisp, uncluttered header */}
      <PageHeader
        eyebrow="Monitor · Coimbatore Cotton Surveillance"
        title="Cotton Jassid Intelligence"
        description="Next-week pest risk forecasting and real-time field surveillance for Coimbatore cotton."
      />

      {/* Hero: Latest Field Check Result (from backend) */}
      {predLoading ? (
        <div className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted-foreground animate-pulse">
          Loading latest field check…
        </div>
      ) : latestPred ? (
        <Link
          to="/recommendations"
          search={{ id: String(latestPred.prediction_id) }}
          className={`block relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-surface via-surface to-primary/5 p-6 shadow-soft transition-colors hover:opacity-90 ${riskBgClass(latestPred.risk_class)}`}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                      latestPred.risk_class === "High"
                        ? "bg-risk-high"
                        : latestPred.risk_class === "Medium"
                          ? "bg-risk-moderate"
                          : "bg-risk-low"
                    }`}
                  />
                  <span
                    className={`relative inline-flex h-3 w-3 rounded-full ${
                      latestPred.risk_class === "High"
                        ? "bg-risk-high"
                        : latestPred.risk_class === "Medium"
                          ? "bg-risk-moderate"
                          : "bg-risk-low"
                    }`}
                  />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Latest Field Check{latestPred.field_name ? ` · ${latestPred.field_name}` : ""}
                </span>
              </div>

              <div className="flex flex-wrap items-baseline gap-3">
                <span
                  className={`font-display text-3xl sm:text-4xl font-extrabold ${riskTextClass(latestPred.risk_class)}`}
                >
                  {latestPred.risk_class.toUpperCase()} RISK
                </span>
                <span className="text-sm font-medium text-foreground/75">
                  ({latestPred.final_score.toFixed(2)} / 3 leaves · ETL: 6.0)
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Confidence: <strong>{latestPred.confidence}</strong> ·{" "}
                {latestPred.image_aggregates?.n_images_used ?? "—"} leaf images · Hopper burn grade{" "}
                {latestPred.image_aggregates?.mean_burn_grade?.toFixed(1) ?? "—"}{" "}
                {latestPred.recommendation?.headline
                  ? `· ${latestPred.recommendation.headline}`
                  : ""}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2 text-xs font-bold text-primary border border-primary/20">
                <Icon name="open_in_new" className="text-[14px]" />
                View Full Report
              </span>
            </div>
          </div>
        </Link>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface via-surface to-primary/5 p-6 shadow-soft">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                No field checks yet
              </span>
              <p className="text-sm text-foreground/80">
                Run your first guided field check to get an explainable jassid risk prediction.
              </p>
            </div>
            <Link
              to="/risk"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
            >
              <Icon name="add_a_photo" className="text-[16px]" />
              Start Field Check
            </Link>
          </div>
        </div>
      )}

      {/* 3 Key Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          icon="pest_control"
          label="Latest Jassid Count"
          value={latestPred ? latestPred.final_score.toFixed(2) : "—"}
          unit="/ 3 leaves"
          hint={latestPred ? `ETL: 6.0 · Confidence: ${latestPred.confidence}` : "No check yet"}
          to="/recommendations"
        />

        <StatTile
          icon="cloud"
          label="Live Coimbatore Weather"
          value={weather ? `${weather.max_temp_c}°C` : "34.2°C"}
          unit={weather ? `· ${weather.rh_morning_pct}% RH` : "· 67% RH"}
          hint={
            weather
              ? `Rain: ${weather.rainfall_mm}mm · Wind: ${weather.wind_speed_kmh}km/h`
              : "Open-Meteo live feed"
          }
          to="/environment"
        />

        <Link to="/recommendations" search={{ id: undefined }} className="block h-full">
          <div className="flex h-full flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon name="checklist" className="text-[20px]" />
              </span>
            </div>
            <div className="mt-5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Recommended Action
              </p>
              <p className="mt-1 font-display text-2xl font-semibold">
                {latestPred?.recommendation?.urgency ?? "Scout"}
              </p>
              <p className="mt-1 text-xs text-foreground/60">
                {latestPred?.recommendation?.rescout_date ?? "Start a field check to get advice"}
              </p>
            </div>
          </div>
        </Link>
      </div>

      <Panel
        title="Recent Predictions"
        subtitle="Your latest five field predictions"
        icon="history"
        action={
          <Link
            to="/recommendations-history"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            View history
            <Icon name="arrow_forward" className="text-[14px]" />
          </Link>
        }
      >
        {recentPredictions.isPending ? (
          <LoadingBlock label="Loading recent predictions…" />
        ) : recentPredictions.isError ? (
          <div
            role="alert"
            className="flex flex-col items-start gap-3 rounded-xl border border-critical/20 bg-critical/5 p-4 text-sm"
          >
            <p className="text-critical">
              {recentPredictions.error instanceof Error
                ? recentPredictions.error.message
                : "Unable to load recent predictions."}
            </p>
            <button
              type="button"
              onClick={() => recentPredictions.refetch()}
              className="font-semibold text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        ) : recentPredictions.data.length === 0 ? (
          <EmptyState
            icon="analytics"
            title="No predictions yet"
            body="Run a field check to see your recent Jassid risk predictions here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-3">
                    Prediction
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Date
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Observed
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Next week
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Risk
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Model
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {recentPredictions.data.map((prediction) => (
                  <tr key={prediction.id} className="text-foreground/80">
                    <td className="px-3 py-3 font-medium">
                      <Link
                        to="/recommendations"
                        search={{ id: String(prediction.id) }}
                        className="text-primary hover:underline"
                      >
                        #{prediction.id}
                      </Link>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {formatDateTime(prediction.created_at)}
                    </td>
                    <td className="px-3 py-3">{prediction.detected_jassid}</td>
                    <td className="px-3 py-3">
                      {prediction.predicted_next_week_jassid.toFixed(2)}
                    </td>
                    <td className="px-3 py-3">
                      <RiskBadge
                        level={getRiskLevel(prediction.risk)}
                        label={prediction.risk}
                        size="sm"
                      />
                    </td>
                    <td className="px-3 py-3">{prediction.model_used}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
