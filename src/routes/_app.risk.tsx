import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel } from "@/components/procrop/ui";
import {
  errorMessage,
  runUnifiedPrediction,
  UnifiedPredictionResponse,
  PredictionResponse,
} from "@/services/api";
import {
  useLatestObservation,
  useLatestObservationPrediction,
  useLiveWeather,
  useRecentPredictions,
  useUnifiedPrediction,
  useDeletePrediction,
} from "@/services/queries";
import { formatDateTime } from "@/utils/formatters";
import { toDisplayName } from "@/utils/columnNames";

export const Route = createFileRoute("/_app/risk")({
  head: () => ({
    meta: [
      { title: "Unified Jassid Risk Engine & Vision Intelligence — ProCrop" },
      {
        name: "description",
        content:
          "Unified pipeline: Computer vision pest counting from a leaf photo, live Coimbatore weather API, and previous-week database lags fed into XGBoost for next-week risk prediction.",
      },
      { property: "og:title", content: "Unified Jassid Risk Engine — ProCrop" },
      {
        property: "og:description",
        content:
          "Unified pipeline: Computer vision pest counting from a leaf photo, live Coimbatore weather API, and previous-week database lags fed into XGBoost for next-week risk prediction.",
      },
    ],
  }),
  component: RiskPage,
});

function RiskPage() {
  // Selection & Image State
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string>("");

  // Pipeline Data Sources (live weather API + SQLite tables)
  const lagsQuery = useLatestObservation();
  const weatherQuery = useLiveWeather();
  const predictionsQuery = useRecentPredictions(500);
  const unifiedPrediction = useUnifiedPrediction();
  const deletePredictionMutation = useDeletePrediction();

  const handleDeletePrediction = (id: number) => {
    if (confirm("Are you sure you want to delete this prediction?")) {
      deletePredictionMutation.mutate(id);
    }
  };

  const liveWeather = weatherQuery.data ?? null;
  const prevWeekData = lagsQuery.data ?? null;
  const recentPredictions = predictionsQuery.data ?? [];

  // Status & Output State
  const latestObservationPrediction = useLatestObservationPrediction();
  const loading = unifiedPrediction.isPending || latestObservationPrediction.isPending;
  const fetchingWeather = weatherQuery.isFetching;
  const fetchingLags = lagsQuery.isFetching;
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [unifiedResult, setUnifiedResult] = useState<UnifiedPredictionResponse | null>(null);
  const [latestObservationResult, setLatestObservationResult] = useState<PredictionResponse | null>(null);

  const handleRefreshWeather = async () => {
    setErrorMsg(null);
    const { data: weather, error } = await weatherQuery.refetch();
    if (weather) {
      setSuccessNotice(`Live Open-Meteo weather updated: ${weather.max_temp_c}°C / ${weather.min_temp_c}°C, ${weather.rh_morning_pct}% RH.`);
    } else {
      setErrorMsg(`Failed to refresh weather: ${errorMessage(error)}`);
    }
  };

  const handleRefreshLags = async () => {
    setErrorMsg(null);
    const { data: prevData, error, isError } = await lagsQuery.refetch();
    if (prevData) {
      setSuccessNotice(`Previous week lags synced from ${prevData.source} (SMW ${prevData.smw ?? "—"}).`);
    } else if (isError) {
      setErrorMsg(`Failed to refresh historical lags: ${errorMessage(error)}`);
    } else {
      setErrorMsg("No observations are stored in weekly_observations.");
    }
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCustomFile(file);
      setPreviewSrc(URL.createObjectURL(file));
      setErrorMsg(null);
      setSuccessNotice(`Loaded custom leaf photo: ${file.name}.`);
    }
  };

  const handleRunUnifiedPrediction = async () => {
    setErrorMsg(null);
    setSuccessNotice(null);
    setLatestObservationResult(null);

    try {
      const params: Parameters<typeof runUnifiedPrediction>[0] = {};
      if (customFile) {
        params.file = customFile;
      } else if (prevWeekData) {
        params.overrideJassid = prevWeekData.jassid_per_3_leaves;
      } else {
        throw new Error("No database observation is available. Upload a leaf image or load database records first.");
      }

      // Saving the prediction refreshes the predictions table below.
      const res = await unifiedPrediction.mutateAsync(params);
      setUnifiedResult(res);
      setSuccessNotice(
        `Prediction complete! Risk assessed as ${res.prediction.risk}.`
      );
    } catch (err: unknown) {
      setErrorMsg(errorMessage(err));
    }
  };

  const handlePredictLatestObservation = async () => {
    setErrorMsg(null);
    setSuccessNotice(null);
    setUnifiedResult(null);

    try {
      const res = await latestObservationPrediction.mutateAsync();
      setLatestObservationResult(res);
      setSuccessNotice(`Computed prediction using the latest observation in the database. Risk: ${res.risk}.`);
    } catch (err: unknown) {
      setErrorMsg(errorMessage(err));
    }
  };

  return (
    <div className="px-5 py-8 md:px-8">
      <PageHeader
        title="Cotton Jassid Risk Engine & Vision Intelligence"
        description="Uses a leaf photo or the latest database Jassid count, combines live weather and stored historical features to predict risk."
      />

      {/* Pipeline Status Indicator Strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      </div>

      {/* Feedback Messages */}
      {successNotice ? (
        <div className="mb-6 rounded-xl border border-primary/30 bg-primary/10 p-3.5 text-xs font-medium text-primary">
          ✅ {successNotice}
        </div>
      ) : null}

      {errorMsg ? (
        <div className="mb-6 rounded-xl border border-critical/30 bg-critical/10 p-3.5 text-xs text-critical">
          ⚠️ {errorMsg}
        </div>
      ) : null}

      {/* STEP 1: PEST COUNT (LEAF PHOTO OR LATEST DATABASE OBSERVATION) */}
      <Panel title="Upload Image" icon="document_scanner" className="mb-8">
        <p className="mb-4 text-xs text-muted-foreground">
          Upload a leaf picture for image analysis.
        </p>

        {/* Custom Upload Dropzone */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-background/40 p-5 text-center">
            <span className="mb-2 text-2xl">📷</span>
            <p className="text-xs font-semibold text-foreground">
              Insert cotton leaf picture
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 mb-3">
              Upload underleaf photo (JPG / PNG)
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleCustomFileUpload}
              className="block w-full text-xs text-muted-foreground file:mr-4 file:rounded-xl file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
            />
          </div>

          {/* Active Image Inspection Card */}
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border">
              {previewSrc ? <img
                src={previewSrc}
                alt="Selected Leaf Sample"
                className="h-full w-full object-cover"
              /> : <div className="flex h-48 items-center justify-center text-sm text-muted-foreground"></div>}
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground">
                {customFile ? `Custom: ${customFile.name}` : "No Photo selected."}
              </p>
            </div>
          </div>
        </div>
      </Panel>

      {/* STEP 2: PIPELINE INPUTS (WEATHER API + PREVIOUS WEEK DATABASE ROW) */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {/* Live Weather API */}
        <Panel title="Live Coimbatore Weather" icon="cloud">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              Real-time atmospheric parameters for Coimbatore Station (11.0168° N, 76.9558° E).
            </p>
            <button
              type="button"
              onClick={handleRefreshWeather}
              disabled={fetchingWeather}
              className="shrink-0 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted disabled:opacity-50"
            >
              {fetchingWeather ? "Syncing..." : "🔄 Refresh"}
            </button>
          </div>

          {liveWeather ? (
            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-background p-2.5">
                <span className="text-muted-foreground text-[10px] uppercase font-semibold">Max / Min Temp</span>
                <p className="text-sm font-semibold mt-0.5">{liveWeather.max_temp_c}°C / {liveWeather.min_temp_c}°C</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-2.5">
                <span className="text-muted-foreground text-[10px] uppercase font-semibold">Morning / Eve RH</span>
                <p className="text-sm font-semibold mt-0.5">{liveWeather.rh_morning_pct}% / {liveWeather.rh_evening_pct}%</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-2.5">
                <span className="text-muted-foreground text-[10px] uppercase font-semibold">Rainfall & Days</span>
                <p className="text-sm font-semibold mt-0.5">{liveWeather.rainfall_mm} mm ({liveWeather.rainy_days}d)</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-2.5">
                <span className="text-muted-foreground text-[10px] uppercase font-semibold">Wind Speed</span>
                <p className="text-sm font-semibold mt-0.5">{liveWeather.wind_speed_kmh} km/h</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-2.5">
                <span className="text-muted-foreground text-[10px] uppercase font-semibold">Sunshine Hours</span>
                <p className="text-sm font-semibold mt-0.5">{liveWeather.sunshine_hours} hrs</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-2.5">
                <span className="text-muted-foreground text-[10px] uppercase font-semibold">Mean Temp & RH</span>
                <p className="text-sm font-semibold mt-0.5">{liveWeather.mean_temp_c}°C / {liveWeather.mean_rh_pct}%</p>
              </div>
            </div>
          ) : weatherQuery.isPending ? (
            <div className="py-4 text-center text-xs text-muted-foreground">
              Loading Open-Meteo Coimbatore weather...
            </div>
          ) : (
            <div role="alert" className="py-4 text-center text-xs text-critical">
              Live weather is unavailable: {errorMessage(weatherQuery.error)}
            </div>
          )}
        </Panel>

        {/* Previous Week Data from the database */}
        <Panel title="Previous Week Lags" icon="dataset">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              Lag features (<code className="font-mono">jassid_lag_1</code>, <code className="font-mono">jassid_lag_2</code>) are read from the <code className="font-mono">weekly_observations</code> table.
            </p>
            <button
              type="button"
              onClick={handleRefreshLags}
              disabled={fetchingLags}
              className="shrink-0 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted disabled:opacity-50"
            >
              {fetchingLags ? "Syncing..." : "🔄 Re-sync"}
            </button>
          </div>

          {prevWeekData ? (
            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-background p-2.5">
                <span className="text-muted-foreground text-[10px] uppercase font-semibold">Prev Week (Lag 1)</span>
                <p className="text-sm font-semibold mt-0.5 text-primary">{prevWeekData.jassid_per_3_leaves} / 3 leaves</p>
                <span className="text-[10px] text-muted-foreground">SMW {prevWeekData.smw ?? "—"} ({prevWeekData.report_year ?? "—"})</span>
              </div>
              <div className="rounded-xl border border-border bg-background p-2.5">
                <span className="text-muted-foreground text-[10px] uppercase font-semibold">2 Weeks Ago (Lag 2)</span>
                <p className="text-sm font-semibold mt-0.5">{prevWeekData.jassid_lag_1 ?? "—"} / 3 leaves</p>
                <span className="text-[10px] text-muted-foreground">{toDisplayName("jassid_lag_1")}</span>
              </div>
              <div className="rounded-xl border border-border bg-background p-2.5">
                <span className="text-muted-foreground text-[10px] uppercase font-semibold">Prev Max Temp</span>
                <p className="text-sm font-semibold mt-0.5">{prevWeekData.max_temp_c ?? "—"}°C</p>
                <span className="text-[10px] text-muted-foreground">{toDisplayName("max_temp_c_lag_1")}</span>
              </div>
              <div className="rounded-xl border border-border bg-background p-2.5">
                <span className="text-muted-foreground text-[10px] uppercase font-semibold">Prev Morning RH</span>
                <p className="text-sm font-semibold mt-0.5">{prevWeekData.rh_morning_pct ?? "—"}%</p>
                <span className="text-[10px] text-muted-foreground">{toDisplayName("rh_morning_pct_lag_1")}</span>
              </div>
              <div className="rounded-xl border border-border bg-background p-2.5">
                <span className="text-muted-foreground text-[10px] uppercase font-semibold">Prev Rainfall</span>
                <p className="text-sm font-semibold mt-0.5">{prevWeekData.rainfall_mm ?? "—"} mm</p>
                <span className="text-[10px] text-muted-foreground">{toDisplayName("rainfall_mm_lag_1")}</span>
              </div>
            </div>
          ) : lagsQuery.isPending ? (
            <div className="py-4 text-center text-xs text-muted-foreground">
              Loading latest observation from the database...
            </div>
          ) : lagsQuery.isError ? (
            <div role="alert" className="py-4 text-center text-xs text-critical">
              Database lags are unavailable: {errorMessage(lagsQuery.error)}
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-muted-foreground">
              No observations are stored in weekly_observations. Add a weekly observation to the database to enable predictions.
            </div>
          )}
        </Panel>
      </div>

      {/* STEP 3: PREDICTION CONTROLS */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleRunUnifiedPrediction}
          disabled={loading}
          className="rounded-2xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-soft transition-all hover:bg-primary/90 hover:shadow-md disabled:opacity-50"
        >
          {loading ? "Analyzing Image & Forecasting Risk..." : "⚡ Predict Next-Week Risk"}
        </button>
      </div>

      {/* STEP 4: PREDICTION OUTPUT (UNIFIED PIPELINE) */}
      {unifiedResult ? (
        <div className="mb-8 space-y-6">
          <Panel title="Unified Prediction & Pest Risk Assessment" icon="bolt" className="border-primary/30">
            {/* Header Result Card */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
              <div>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="font-display text-5xl font-extrabold text-foreground">
                    {unifiedResult.prediction.predicted_next_week_jassid}
                  </span>
                  <span className="text-sm font-medium text-foreground/70">
                    Jassids / 3 leaves (Predicted Next-Week Population)
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span
                  className={`rounded-2xl px-5 py-2 text-base font-extrabold shadow-sm ${
                    unifiedResult.prediction.risk === "HIGH"
                      ? "bg-risk-high/15 text-risk-high border border-risk-high/30"
                      : "bg-risk-low/15 text-risk-low border border-risk-low/30"
                  }`}
                >
                  {unifiedResult.prediction.risk} RISK (Threshold ≥ {unifiedResult.prediction.risk_threshold})
                </span>
              </div>
            </div>

            {/* Vision + Model Inputs Review */}
            <div className="my-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-surface p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Vision Detected Leaf Count</p>
                <p className="text-2xl font-bold mt-1 text-primary">
                  {unifiedResult.vision_analysis?.jassid_per_3_leaves ?? unifiedResult.previous_week_data.jassid_per_3_leaves}{" "}
                  <span className="text-xs font-normal text-muted-foreground">/ 3 leaves</span>
                </p>
                <p className="text-[11px] text-foreground/70 mt-1">
                  {unifiedResult.vision_analysis ? `${unifiedResult.vision_analysis.detected_spots_on_leaf} pest spots detected (${Math.round(unifiedResult.vision_analysis.confidence * 100)}% conf)` : "Count read from weekly_observations in SQLite"}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Previous Week History</p>
                <p className="text-2xl font-bold mt-1">
                  {unifiedResult.previous_week_data.jassid_per_3_leaves}{" "}
                  <span className="text-xs font-normal text-muted-foreground">/ 3 leaves (Lag 1)</span>
                </p>
                <p className="text-[11px] text-foreground/70 mt-1">
                  Lag 2: {unifiedResult.previous_week_data.jassid_lag_1 ?? "—"} / 3 leaves (SMW {unifiedResult.previous_week_data.smw ?? "—"})
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Live Weather Parameters</p>
                <p className="text-2xl font-bold mt-1">
                  {unifiedResult.live_weather.max_temp_c}°C{" "}
                  <span className="text-xs font-normal text-muted-foreground">/ {unifiedResult.live_weather.rh_morning_pct}% RH</span>
                </p>
                <p className="text-[11px] text-foreground/70 mt-1">
                  Rain: {unifiedResult.live_weather.rainfall_mm}mm · Wind: {unifiedResult.live_weather.wind_speed_kmh}km/h
                </p>
              </div>
            </div>
          </Panel>
        </div>
      ) : null}

      {/* STEP 4B: LATEST DATABASE OBSERVATION PREDICTION OUTPUT */}
      {latestObservationResult ? (
        <div className="mb-8 rounded-2xl border border-primary/30 bg-surface p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Latest Database Observation Output
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-4xl font-extrabold">{latestObservationResult.predicted_next_week_jassid}</span>
              <span className="text-xs text-foreground/70">Jassids / 3 leaves (Next-Week)</span>
            </div>
            <span
              className={`rounded-full px-4 py-1 text-xs font-bold ${
                latestObservationResult.risk === "HIGH" ? "bg-risk-high/15 text-risk-high" : "bg-risk-low/15 text-risk-low"
              }`}
            >
              {latestObservationResult.risk} RISK
            </span>
          </div>
        </div>
      ) : null}

      {/* STEP 5: PREDICTIONS DATABASE TABLE (PERSISTENCE LOG) */}
      <Panel title="Predictions Table" icon="database">
        <p className="mb-4 text-xs text-muted-foreground">
          Every prediction triggered from leaf photo analysis, live weather, and database lags is logged directly into the table.
        </p>

        {predictionsQuery.isPending ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            Loading saved predictions from the database...
          </div>
        ) : predictionsQuery.isError ? (
          <div role="alert" className="py-6 text-center text-xs text-critical">
            Saved predictions are unavailable: {errorMessage(predictionsQuery.error)}
          </div>
        ) : recentPredictions.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/50 text-[10px] uppercase font-bold text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5">#</th>
                  <th className="px-3 py-2.5">Timestamp</th>
                  <th className="px-3 py-2.5">Leaf Sample / Source</th>
                  <th className="px-3 py-2.5">Detected Jassid</th>
                  <th className="px-3 py-2.5">Prev Lags (L1 / L2)</th>
                  <th className="px-3 py-2.5">Weather (Max T / RH)</th>
                  <th className="px-3 py-2.5">Predicted Next Week</th>
                  <th className="px-3 py-2.5">Risk Level</th>
                  <th className="px-3 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 bg-surface">
                {recentPredictions.map((row, index) => (
                  <tr key={row.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2 font-mono font-semibold text-primary" title={`Prediction ID: #${row.id}`}>
                      {recentPredictions.length - index}
                    </td>
                    <td
                      className="px-3 py-2 whitespace-nowrap text-muted-foreground"
                      title={row.created_at ? `${row.created_at} UTC` : undefined}
                    >
                      {formatDateTime(row.created_at)}
                    </td>
                    <td className="px-3 py-2 font-medium">{row.image_name}</td>
                    <td className="px-3 py-2 font-semibold text-foreground">
                      {row.detected_jassid} / 3l
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.prev_week_jassid_lag_1} / {row.prev_week_jassid_lag_2}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.max_temp_c}°C / {row.rh_morning_pct}%
                    </td>
                    <td className="px-3 py-2 font-bold text-foreground">
                      {row.predicted_next_week_jassid} / 3l
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          row.risk === "HIGH" ? "bg-risk-high/15 text-risk-high" : "bg-risk-low/15 text-risk-low"
                        }`}
                      >
                        {row.risk}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleDeletePrediction(row.id)}
                        disabled={deletePredictionMutation.isPending}
                        className="rounded-lg border border-destructive/30 bg-destructive/10 px-2 py-1 text-[10px] font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No predictions saved in database yet. Run a prediction above to insert the first record.
          </div>
        )}
      </Panel>
    </div>
  );
}
