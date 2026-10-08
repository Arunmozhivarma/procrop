import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel, RiskBadge } from "@/components/procrop/ui";
import { predictions, riskFromProbability } from "@/lib/procrop-data";
import {
  fetchLivePrediction,
  fetchLatestDatasetPrediction,
  fetchLiveCoimbatoreWeather,
  JassidPredictionInput,
  PredictionResponse,
} from "@/services/api";

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

const defaultFormInput: JassidPredictionInput = {
  jassid_per_3_leaves: 2.1,
  jassid_lag_1: 1.8,
  jassid_lag_2: 1.5,
  max_temp_c: 34.2,
  min_temp_c: 24.1,
  rh_morning_pct: 82,
  rh_evening_pct: 58,
  rainfall_mm: 18,
  rainy_days: 3,
  wind_speed_kmh: 9,
  sunshine_hours: 6.4,
  max_temp_c_lag_1: 33.5,
  min_temp_c_lag_1: 23.8,
  rh_morning_pct_lag_1: 80,
  rh_evening_pct_lag_1: 55,
  rainfall_mm_lag_1: 10,
  rainy_days_lag_1: 2,
  wind_speed_kmh_lag_1: 8,
  sunshine_hours_lag_1: 7.0,
};

function RiskPage() {
  const [formData, setFormData] = useState<JassidPredictionInput>(defaultFormInput);
  const [liveResult, setLiveResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingWeather, setFetchingWeather] = useState<boolean>(false);
  const [weatherNotice, setWeatherNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleInputChange = (key: keyof JassidPredictionInput, val: number) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const handleFetchLiveWeather = async () => {
    setFetchingWeather(true);
    setWeatherNotice(null);
    try {
      const weather = await fetchLiveCoimbatoreWeather();
      setFormData((prev) => ({
        ...prev,
        max_temp_c: weather.max_temp_c,
        min_temp_c: weather.min_temp_c,
        rh_morning_pct: weather.rh_morning_pct,
        rh_evening_pct: weather.rh_evening_pct,
        rainfall_mm: weather.rainfall_mm,
        rainy_days: weather.rainy_days,
        wind_speed_kmh: weather.wind_speed_kmh,
        sunshine_hours: weather.sunshine_hours,
      }));
      setWeatherNotice(
        `Loaded live Open-Meteo weather for Coimbatore: ${weather.max_temp_c}°C / ${weather.min_temp_c}°C, ${weather.rh_morning_pct}% RH, ${weather.rainfall_mm}mm rain.`
      );
    } catch (err: any) {
      setErrorMsg("Failed to fetch live weather from backend. Check FastAPI server.");
    } finally {
      setFetchingWeather(false);
    }
  };

  const handleRunCustomPrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchLivePrediction(formData);
      setLiveResult(res);
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          "Could not connect to FastAPI backend at http://localhost:8000. Ensure uvicorn server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePredictLatest = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchLatestDatasetPrediction();
      setLiveResult(res);
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          "Could not connect to FastAPI backend at http://localhost:8000. Ensure uvicorn server is running."
      );
    } finally {
      setLoading(false);
    }
  };

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

      {/* Interactive Live Prediction Form */}
      <Panel title="Live XGBoost Interactive Predictor" icon="bolt" className="mb-8">
        <p className="mb-4 text-xs text-muted-foreground">
          Farmers can upload a leaf photo or auto-fetch live weather for Coimbatore from Open-Meteo API.
          Connected to local FastAPI server at <code className="font-mono">http://localhost:8000/predict</code>.
        </p>

        <div className="mb-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handlePredictLatest}
            disabled={loading}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Connecting to Backend..." : "⚡ Run Prediction on Latest Excel Dataset Week"}
          </button>

          <button
            type="button"
            onClick={handleFetchLiveWeather}
            disabled={fetchingWeather}
            className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {fetchingWeather ? "Fetching Weather..." : "🌤️ Fetch Real-Time Coimbatore Weather (Open-Meteo API)"}
          </button>
        </div>

        {weatherNotice ? (
          <div className="mb-4 rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs text-primary font-medium">
            ✅ {weatherNotice}
          </div>
        ) : null}

        {errorMsg ? (
          <div className="mb-4 rounded-xl border border-critical/30 bg-critical/10 p-3 text-xs text-critical">
            ⚠️ {errorMsg}
          </div>
        ) : null}

        <form onSubmit={handleRunCustomPrediction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">
                Jassid Count (jassid_per_3_leaves)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.jassid_per_3_leaves}
                onChange={(e) => handleInputChange("jassid_per_3_leaves", parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">
                Jassid Lag 1 (Previous Week)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.jassid_lag_1}
                onChange={(e) => handleInputChange("jassid_lag_1", parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">
                Jassid Lag 2 (2 Weeks Ago)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.jassid_lag_2}
                onChange={(e) => handleInputChange("jassid_lag_2", parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-foreground/70 mb-1">
                Max Temp (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.max_temp_c}
                onChange={(e) => handleInputChange("max_temp_c", parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/70 mb-1">
                Min Temp (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.min_temp_c}
                onChange={(e) => handleInputChange("min_temp_c", parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/70 mb-1">
                RH Morning (%)
              </label>
              <input
                type="number"
                value={formData.rh_morning_pct}
                onChange={(e) => handleInputChange("rh_morning_pct", parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/70 mb-1">
                Rainfall (mm)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.rainfall_mm}
                onChange={(e) => handleInputChange("rainfall_mm", parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-sm"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Run Model Prediction
            </button>
          </div>
        </form>

        {/* Display Live Backend Prediction Result */}
        {liveResult ? (
          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Backend Prediction Output ({liveResult.model_used})
                </p>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="font-display text-4xl font-semibold">
                    {liveResult.predicted_next_week_jassid}
                  </span>
                  <span className="text-sm text-foreground/70">Jassids / 3 leaves (Next-Week)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                    liveResult.risk === "HIGH"
                      ? "bg-risk-high/15 text-risk-high"
                      : "bg-risk-low/15 text-risk-low"
                  }`}
                >
                  {liveResult.risk} RISK (Threshold ≥ {liveResult.risk_threshold})
                </span>
              </div>
            </div>

            {liveResult.explanation && liveResult.explanation.length > 0 ? (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Live SHAP Feature Attributions
                </p>
                <div className="space-y-2">
                  {liveResult.explanation.map((c) => (
                    <div key={c.feature} className="flex items-center gap-3 text-sm">
                      <span className="w-52 shrink-0 text-foreground/70">{c.feature}</span>
                      <span className="w-20 shrink-0 text-xs text-muted-foreground">
                        {c.value !== undefined ? c.value : "-"}
                      </span>
                      <span className="h-2 flex-1 rounded-full bg-muted">
                        <span
                          className={
                            c.contribution >= 0
                              ? "block h-2 rounded-full bg-risk-high"
                              : "block h-2 rounded-full bg-risk-low"
                          }
                          style={{
                            width: `${Math.min(100, Math.abs(c.contribution) * 80)}%`,
                          }}
                        />
                      </span>
                      <span
                        className={`w-16 shrink-0 text-right text-xs font-semibold ${
                          c.contribution >= 0 ? "text-risk-high" : "text-risk-low"
                        }`}
                      >
                        {c.contribution >= 0 ? "+" : ""}
                        {c.contribution.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Panel>

      {/* Historical Offline Scenarios */}
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
