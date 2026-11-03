import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { Icon } from "@/components/Icon";
import {
  fetchPredictionDetail,
  fetchLatestPrediction,
  type DetailedPredictionResponse,
} from "@/services/api";

// Search params: ?id=<prediction_id>
export const Route = createFileRoute("/_app/recommendations")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: search["id"] ? String(search["id"]) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Field Risk Report & Recommendations — ProCrop" },
      {
        name: "description",
        content:
          "Explainable jassid risk assessment with photo evidence, SHAP drivers, weather context, and IPM action plan for your cotton field.",
      },
      { property: "og:title", content: "Field Risk Report — ProCrop" },
    ],
  }),
  component: RecommendationsPage,
});

function riskColor(risk: string) {
  if (risk === "High") return "text-risk-high";
  if (risk === "Medium") return "text-risk-moderate";
  return "text-risk-low";
}
function riskBg(risk: string) {
  if (risk === "High") return "bg-risk-high/15 border-risk-high/30 text-risk-high";
  if (risk === "Medium") return "bg-risk-moderate/15 border-risk-moderate/30 text-risk-moderate";
  return "bg-risk-low/15 border-risk-low/30 text-risk-low";
}
function riskIcon(risk: string) {
  if (risk === "High") return "warning";
  if (risk === "Medium") return "trending_up";
  return "check_circle";
}
function confidenceColor(conf: string) {
  if (conf === "High") return "text-emerald-600 dark:text-emerald-400";
  if (conf === "Medium") return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

function burnGradeLabel(grade: number) {
  if (grade < 0.5) return "Grade 0 — No visible damage";
  if (grade < 1.5) return "Grade 1 — Slight yellowing at leaf margins";
  if (grade < 2.5) return "Grade 2 — Moderate yellowing, cupping begins";
  if (grade < 3.5) return "Grade 3 — Widespread reddening / browning";
  return "Grade 4 — Severe desiccation";
}

function burnGradeColor(grade: number) {
  if (grade < 1) return "text-emerald-600 dark:text-emerald-400";
  if (grade < 2) return "text-amber-500 dark:text-amber-400";
  if (grade < 3) return "text-orange-500 dark:text-orange-400";
  return "text-rose-600 dark:text-rose-400";
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function RecommendationsPage() {
  const { id } = Route.useSearch();
  const [data, setData] = useState<DetailedPredictionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let result: DetailedPredictionResponse | null = null;
      if (id) {
        result = await fetchPredictionDetail(id);
      } else {
        result = await fetchLatestPrediction();
      }
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">
            progress_activity
          </span>
          <p className="text-sm font-medium">Loading field risk report…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="px-5 py-12 md:px-8 max-w-3xl mx-auto">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center">
          <Icon name="error" className="text-destructive text-4xl mb-3" />
          <p className="font-semibold text-destructive">{error || "No prediction found."}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {id
              ? `Prediction #${id} could not be retrieved.`
              : "No field checks recorded yet for this account."}
          </p>
          <Link
            to="/risk"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Icon name="add_a_photo" className="text-[16px]" />
            Start a New Field Check
          </Link>
        </div>
      </div>
    );
  }

  const {
    risk_class,
    final_score,
    score_per_leaf,
    confidence,
    base_score,
    compound_multiplier,
    modifiers = [],
    shap_drivers = [],
    image_aggregates,
    weather_snapshot,
    recommendation,
    per_image_results = [],
    field_name,
    created_at,
  } = data;

  const etl = 6.0; // ICAR ETL: 2 nymphs/leaf × 3 leaves
  const etlPct = Math.min(200, Math.round((final_score / etl) * 100));

  return (
    <div className="space-y-6 px-4 py-8 md:px-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <PageHeader
        eyebrow={`Field Risk Report${field_name ? ` · ${field_name}` : ""}`}
        title="Jassid Risk Assessment"
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/risk"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary/90"
            >
              <Icon name="add" className="text-[14px]" />
              New Check
            </Link>
          </div>
        }
      />

      {/* ==================== 1. BIG RISK BADGE ==================== */}
      <div
        className={`relative overflow-hidden rounded-2xl border-2 p-6 shadow-soft ${riskBg(risk_class)}`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/30 dark:bg-black/20">
              <span className={`material-symbols-outlined text-4xl ${riskColor(risk_class)}`}>
                {riskIcon(risk_class)}
              </span>
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-75">
                Predicted Next-Week Risk
              </p>
              <p className={`font-display text-4xl font-extrabold ${riskColor(risk_class)}`}>
                {risk_class.toUpperCase()} RISK
              </p>
              <p className="text-sm font-semibold opacity-80 mt-0.5">
                {final_score.toFixed(2)} / 3 leaves ({score_per_leaf?.toFixed(2) ?? "—"} per leaf)
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1.5">
            <span className={`text-sm font-bold ${confidenceColor(confidence)}`}>
              {confidence} Confidence
            </span>
            {/* ETL progress bar */}
            <div className="w-32 sm:w-44 h-2 rounded-full bg-white/40 dark:bg-black/20 overflow-hidden mt-1">
              <div
                className={`h-full rounded-full transition-all ${
                  risk_class === "High"
                    ? "bg-risk-high"
                    : risk_class === "Medium"
                      ? "bg-risk-moderate"
                      : "bg-risk-low"
                }`}
                style={{ width: `${Math.min(100, etlPct)}%` }}
              />
            </div>
          </div>
        </div>

        {recommendation?.headline && (
          <div className="mt-4 pt-4 border-t border-white/30 dark:border-black/20">
            <p className="text-sm font-semibold opacity-90">
              <Icon name="info" className="text-[15px] align-middle mr-1" />
              {recommendation.headline}
            </p>
          </div>
        )}
      </div>

      {/* ==================== 2. TOP DRIVERS (SHAP + MODIFIERS) ==================== */}
      <Panel
        title="Risk Score Breakdown"
        icon="analytics"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          {/* SHAP Drivers */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Top Feature Contributions (SHAP)
            </p>
            {shap_drivers.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Not available for this prediction.
              </p>
            ) : (
              <div className="space-y-2.5">
                {shap_drivers.slice(0, 6).map((d, i) => {
                  const maxAbs = Math.max(...shap_drivers.map((x) => Math.abs(x.contribution)));
                  const barWidth = maxAbs > 0 ? (Math.abs(d.contribution) / maxAbs) * 100 : 0;
                  const isPositive = d.contribution > 0;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground truncate max-w-[60%]">
                          {d.feature}
                        </span>
                        <span
                          className={`font-bold ${isPositive ? "text-risk-high" : "text-risk-low"}`}
                        >
                          {isPositive ? "+" : ""}
                          {d.contribution.toFixed(3)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isPositive ? "bg-risk-high" : "bg-risk-low"}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="text-[10px] text-muted-foreground pt-1">
                  Base ML score: <strong>{base_score.toFixed(2)}</strong> → Modifiers applied: ×
                  {compound_multiplier.toFixed(3)} → Final:{" "}
                  <strong>{final_score.toFixed(2)}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Expert-Rule Modifiers */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Management Modifiers (Expert Priors)
            </p>
            {modifiers.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No modifiers applied (neutral inputs).
              </p>
            ) : (
              <div className="space-y-2.5">
                {modifiers.map((m, i) => (
                  <div key={i} className="rounded-xl border border-border bg-surface p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground capitalize">
                        {m.category.replace(/_/g, " ")}
                      </span>
                      <span
                        className={`text-xs font-bold rounded-full px-2 py-0.5 ${
                          m.multiplier < 1
                            ? "bg-risk-low/15 text-risk-low"
                            : m.multiplier > 1
                              ? "bg-risk-high/15 text-risk-high"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        ×{m.multiplier.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/80">{m.explanation}</p>
                    <p className="text-[10px] text-muted-foreground italic">{m.disclaimer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Panel>

      {/* ==================== 3. PHOTO EVIDENCE ==================== */}
      {image_aggregates && (
        <Panel
          title="Photo Evidence"
          icon="photo_library"
          subtitle={`${image_aggregates.n_images_used} / ${image_aggregates.n_images_uploaded} images passed quality check`}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                Total Jassids Counted
              </p>
              <p className="font-display text-3xl font-bold text-foreground mt-1">
                {image_aggregates.total_pests_counted}
              </p>
              <p className="text-xs text-muted-foreground">
                {image_aggregates.total_adults} adults · {image_aggregates.total_nymphs} nymphs
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                Mean / Leaf
              </p>
              <p className="font-display text-3xl font-bold text-foreground mt-1">
                {image_aggregates.mean_per_leaf.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                95% CI [{image_aggregates.bootstrap_ci_95?.lower?.toFixed(2) ?? "—"} –{" "}
                {image_aggregates.bootstrap_ci_95?.upper?.toFixed(2) ?? "—"}]
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                Hopper Burn Grade
              </p>
              <p
                className={`font-display text-3xl font-bold mt-1 ${burnGradeColor(image_aggregates.mean_burn_grade)}`}
              >
                {image_aggregates.mean_burn_grade.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">
                {burnGradeLabel(image_aggregates.mean_burn_grade)}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                Variability (CV)
              </p>
              <p className="font-display text-3xl font-bold text-foreground mt-1">
                {((image_aggregates.cv ?? 0) * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {image_aggregates.n_images_rejected > 0
                  ? `${image_aggregates.n_images_rejected} images excluded`
                  : "All images passed QC"}
              </p>
            </div>
          </div>

          {/* Per-Image Summary Table (compact) */}
          {per_image_results.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Per-Image Breakdown
              </p>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-1.5 pr-3">Image</th>
                    <th className="pb-1.5 pr-3">Adults</th>
                    <th className="pb-1.5 pr-3">Nymphs</th>
                    <th className="pb-1.5 pr-3">Total</th>
                    <th className="pb-1.5 pr-3">Burn</th>
                    <th className="pb-1.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {per_image_results.map((img, i) => (
                    <tr key={i} className="border-b border-border/30">
                      <td className="py-1.5 pr-3 font-medium truncate max-w-[100px]">
                        {img.filename || `Leaf ${i + 1}`}
                      </td>
                      <td className="py-1.5 pr-3">{img.n_adults ?? 0}</td>
                      <td className="py-1.5 pr-3">{img.n_nymphs ?? 0}</td>
                      <td className="py-1.5 pr-3 font-semibold">{img.total ?? 0}</td>
                      <td className="py-1.5 pr-3">
                        {img.hopper_burn?.burn_grade !== undefined
                          ? img.hopper_burn.burn_grade.toFixed(1)
                          : "—"}
                      </td>
                      <td className="py-1.5">
                        {img.quality_flags?.["is_blurry"] ||
                        img.quality_flags?.["is_dark"] ||
                        img.quality_flags?.["no_leaf_found"] ? (
                          <span className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 font-medium">
                            Flagged
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 font-medium">
                            Good
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {/* ==================== 4. WEATHER CONTEXT ==================== */}
      {weather_snapshot && (
        <Panel
          title="Weather Context Used"
          icon="cloud"
          subtitle={`Source: ${weather_snapshot.source || "Open-Meteo"} ${!weather_snapshot.is_weather_available ? " · ⚠ Cached / fallback" : ""}`}
        >
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            {[
              { label: "Max Temp", value: `${weather_snapshot.max_temp_c}°C`, icon: "thermometer" },
              { label: "Min Temp", value: `${weather_snapshot.min_temp_c}°C`, icon: "thermostat" },
              {
                label: "Morning RH",
                value: `${weather_snapshot.rh_morning_pct}%`,
                icon: "water_drop",
              },
              { label: "Rainfall", value: `${weather_snapshot.rainfall_mm} mm`, icon: "rainy" },
              {
                label: "Rainy Days",
                value: `${weather_snapshot.rainy_days}`,
                icon: "calendar_month",
              },
              {
                label: "Wind",
                value: `${weather_snapshot.wind_speed_kmh ?? "—"} km/h`,
                icon: "air",
              },
              {
                label: "7-Day Forecast Rain",
                value:
                  weather_snapshot.forecast_7d_rainfall_mm != null
                    ? `${weather_snapshot.forecast_7d_rainfall_mm} mm`
                    : "—",
                icon: "umbrella",
              },
              {
                label: "7-Day Avg Max Temp",
                value:
                  weather_snapshot.forecast_7d_max_temp_mean != null
                    ? `${weather_snapshot.forecast_7d_max_temp_mean}°C`
                    : "—",
                icon: "sunny",
              },
            ].map((w) => (
              <div key={w.label} className="rounded-xl border border-border bg-surface p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon name={w.icon} className="text-[14px] text-muted-foreground" />
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                    {w.label}
                  </p>
                </div>
                <p className="text-sm font-bold text-foreground">{w.value}</p>
              </div>
            ))}
          </div>
          {!weather_snapshot.is_weather_available && (
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 italic">
              ⚠ Live weather was unavailable at the time of this check. Cached or seasonal baseline
              values were used.
            </p>
          )}
        </Panel>
      )}

      {/* ==================== 5. RECOMMENDATIONS (DECISION TABLE) ==================== */}
      {recommendation && (
        <Panel
          title="IPM Action Plan"
          icon="task_alt"
          subtitle={`${recommendation.urgency} · Re-scout by: ${recommendation.rescout_date}`}
        >
          <div className="space-y-5">
            {/* Re-scout date callout */}
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <Icon name="event" className="text-primary text-xl shrink-0" />
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wide">
                  Next Scout Date
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {recommendation.rescout_date}
                </p>
              </div>
            </div>

            {/* Actions */}
            {recommendation.actions?.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                  Recommended Actions
                </p>
                <ul className="space-y-2">
                  {recommendation.actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Icon name="check" className="text-primary text-[12px]" />
                      </span>
                      <span className="text-foreground/90">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Spray guidance */}
            {recommendation.spray_guidance && (
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Spray Guidance
                </p>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {recommendation.spray_guidance}
                </p>
              </div>
            )}

            {/* IRAC rotation note */}
            {recommendation.rotation_note && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex items-start gap-2">
                  <Icon
                    name="rotate_right"
                    className="text-amber-600 dark:text-amber-400 text-[18px] mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-1">
                      IRAC Chemical Rotation Guidance
                    </p>
                    <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
                      {recommendation.rotation_note}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Panel>
      )}


      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
        >
          <Icon name="arrow_back" className="text-[16px]" />
          Back to Dashboard
        </Link>
        <Link
          to="/risk"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Icon name="add_a_photo" className="text-[16px]" />
          New Field Check
        </Link>
      </div>
    </div>
  );
}
