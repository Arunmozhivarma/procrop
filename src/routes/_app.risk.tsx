import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, Panel } from "@/components/procrop/ui";
import {
  runUnifiedPrediction,
  fetchLiveCoimbatoreWeather,
  fetchPreviousWeekData,
  fetchRecentPredictions,
  fetchLatestDatasetPrediction,
  UnifiedPredictionResponse,
  LiveWeatherResponse,
  PreviousWeekData,
  SavedPredictionRecord,
  PredictionResponse,
} from "@/services/api";

export const Route = createFileRoute("/_app/risk")({
  head: () => ({
    meta: [
      { title: "Unified Jassid Risk Engine & Vision Intelligence — ProCrop" },
      {
        name: "description",
        content:
          "Unified pipeline: Computer vision pest counting from leaf photo samples, live Coimbatore weather API, and previous-week Excel/DB lags fed into XGBoost for next-week risk prediction.",
      },
      { property: "og:title", content: "Unified Jassid Risk Engine — ProCrop" },
      {
        property: "og:description",
        content:
          "Unified pipeline: Computer vision pest counting from leaf photo samples, live Coimbatore weather API, and previous-week Excel/DB lags fed into XGBoost for next-week risk prediction.",
      },
    ],
  }),
  component: RiskPage,
});

const sampleLeaves = [
  {
    id: "sample-heavy",
    title: "Field Sample A — Heavy Infestation",
    subtitle: "Canopy underside scan · Coimbatore Block 1",
    src: "/sample-leaves/jassid_heavy_sample.jpg",
    fileName: "jassid_heavy_sample.jpg",
    badge: "SAMPLE LEAF A",
    expectedTag: "High pest pressure",
  },
  {
    id: "sample-moderate",
    title: "Field Sample B — Moderate Activity",
    subtitle: "Canopy underside scan · Coimbatore Block 2",
    src: "/sample-leaves/jassid_moderate_sample.jpg",
    fileName: "jassid_moderate_sample.jpg",
    badge: "SAMPLE LEAF B",
    expectedTag: "Economic threshold window",
  },
  {
    id: "sample-mild",
    title: "Field Sample C — Mild / Healthy Canopy",
    subtitle: "Canopy underside scan · Coimbatore Block 3",
    src: "/sample-leaves/jassid_mild_sample.jpg",
    fileName: "jassid_mild_sample.jpg",
    badge: "SAMPLE LEAF C",
    expectedTag: "Sub-threshold / Clean",
  },
];

function RiskPage() {
  // Selection & Image State
  const [selectedSampleId, setSelectedSampleId] = useState<string>("sample-moderate");
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string>("/sample-leaves/jassid_moderate_sample.jpg");

  // Pipeline Data Sources State
  const [liveWeather, setLiveWeather] = useState<LiveWeatherResponse | null>(null);
  const [prevWeekData, setPrevWeekData] = useState<PreviousWeekData | null>(null);
  const [recentPredictions, setRecentPredictions] = useState<SavedPredictionRecord[]>([]);

  // Overrides / Manual adjustments (optional for what-if simulation)
  const [manualJassid, setManualJassid] = useState<number | null>(null);
  const [manualLag1, setManualLag1] = useState<number | null>(null);
  const [manualLag2, setManualLag2] = useState<number | null>(null);

  // Status & Output State
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingWeather, setFetchingWeather] = useState<boolean>(false);
  const [fetchingLags, setFetchingLags] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [unifiedResult, setUnifiedResult] = useState<UnifiedPredictionResponse | null>(null);
  const [excelLatestResult, setExcelLatestResult] = useState<PredictionResponse | null>(null);

  // Initialize data sources on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [weather, prevData, preds] = await Promise.all([
        fetchLiveCoimbatoreWeather().catch(() => null),
        fetchPreviousWeekData().catch(() => null),
        fetchRecentPredictions(10).catch(() => []),
      ]);
      if (weather) setLiveWeather(weather);
      if (prevData) setPrevWeekData(prevData);
      if (preds) setRecentPredictions(preds);
    } catch {
      // Handled quietly
    }
  };

  const handleRefreshWeather = async () => {
    setFetchingWeather(true);
    setErrorMsg(null);
    try {
      const weather = await fetchLiveCoimbatoreWeather();
      setLiveWeather(weather);
      setSuccessNotice(`Live Open-Meteo weather updated: ${weather.max_temp_c}°C / ${weather.min_temp_c}°C, ${weather.rh_morning_pct}% RH.`);
    } catch (err: any) {
      setErrorMsg(`Failed to refresh weather: ${err.message}`);
    } finally {
      setFetchingWeather(false);
    }
  };

  const handleRefreshLags = async () => {
    setFetchingLags(true);
    setErrorMsg(null);
    try {
      const prevData = await fetchPreviousWeekData();
      setPrevWeekData(prevData);
      setSuccessNotice(`Previous week lags synced from ${prevData.source} (SMW ${prevData.smw}).`);
    } catch (err: any) {
      setErrorMsg(`Failed to refresh historical lags: ${err.message}`);
    } finally {
      setFetchingLags(false);
    }
  };

  const handleSelectSample = (sample: typeof sampleLeaves[0]) => {
    setSelectedSampleId(sample.id);
    setCustomFile(null);
    setPreviewSrc(sample.src);
    setManualJassid(null);
    setErrorMsg(null);
    setSuccessNotice(`Selected ${sample.title}. Ready for prediction.`);
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCustomFile(file);
      setSelectedSampleId("");
      setPreviewSrc(URL.createObjectURL(file));
      setManualJassid(null);
      setErrorMsg(null);
      setSuccessNotice(`Loaded custom leaf photo: ${file.name}.`);
    }
  };

  const handleRunUnifiedPrediction = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessNotice(null);
    setExcelLatestResult(null);

    try {
      const params: Parameters<typeof runUnifiedPrediction>[0] = {};
      if (customFile) {
        params.file = customFile;
      } else {
        params.sampleId = selectedSampleId || "sample-moderate";
      }

      if (manualJassid !== null) params.overrideJassid = manualJassid;
      if (manualLag1 !== null) params.overrideLag1 = manualLag1;
      if (manualLag2 !== null) params.overrideLag2 = manualLag2;

      const res = await runUnifiedPrediction(params);
      setUnifiedResult(res);
      setSuccessNotice(
        `Prediction complete! Risk assessed as ${res.prediction.risk}. Recorded to database table (#ID ${res.db_record.id}).`
      );

      // Refresh recent predictions from DB table
      const updatedPreds = await fetchRecentPredictions(10);
      setRecentPredictions(updatedPreds);
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          "Prediction failed. Ensure the FastAPI backend server is running on http://localhost:8000."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePredictLatestFromExcel = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessNotice(null);
    setUnifiedResult(null);

    try {
      const res = await fetchLatestDatasetPrediction();
      setExcelLatestResult(res);
      setSuccessNotice(`Computed prediction using latest row in Excel dataset. Risk: ${res.risk}.`);

      // Refresh recent predictions from DB table
      const updatedPreds = await fetchRecentPredictions(10);
      setRecentPredictions(updatedPreds);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to predict from latest Excel row.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-5 py-8 md:px-8">
      <PageHeader
        eyebrow="Predict · Unified AI Pipeline"
        title="Cotton Jassid Risk Engine & Vision Intelligence"
        description="Single-page unified workflow: Computer vision extracts pest counts from leaf photos (or 3 field samples), combines real-time Open-Meteo Coimbatore weather with historical Excel/DB lags, runs XGBoost risk prediction, and logs every prediction to the database."
      />

      {/* Pipeline Status Indicator Strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface p-3 text-xs">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
            📷
          </span>
          <div>
            <p className="font-semibold text-foreground">Leaf Vision</p>
            <p className="text-[11px] text-muted-foreground">3 Samples + Upload</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface p-3 text-xs">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
            🌤️
          </span>
          <div>
            <p className="font-semibold text-foreground">Weather API</p>
            <p className="text-[11px] text-muted-foreground">
              {liveWeather ? `${liveWeather.max_temp_c}°C / ${liveWeather.rh_morning_pct}% RH` : "Open-Meteo Live"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface p-3 text-xs">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
            📊
          </span>
          <div>
            <p className="font-semibold text-foreground">Excel / DB Lags</p>
            <p className="text-[11px] text-muted-foreground">
              {prevWeekData ? `SMW ${prevWeekData.smw} (${prevWeekData.jassid_per_3_leaves}/3l)` : "Historical synced"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface p-3 text-xs">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
            💾
          </span>
          <div>
            <p className="font-semibold text-foreground">Prediction DB</p>
            <p className="text-[11px] text-muted-foreground">
              {recentPredictions.length} records saved
            </p>
          </div>
        </div>
      </div>

      {/* Threshold disclaimer */}
      <div className="mb-6 rounded-xl border border-border bg-muted/40 p-3.5 text-xs text-foreground/75">
        <span className="font-semibold text-foreground">Classification note: </span>
        The HIGH / LOW risk threshold of <span className="font-semibold">≥ 1.95 Jassids per 3 leaves</span> is an experimental median-derived rule applied to the Coimbatore dataset. It is <span className="font-semibold">not an official ICAR economic threshold level (ETL)</span>.
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

      {/* STEP 1: LEAF PHOTO PEST COUNT (3 SAMPLES OR INSERT PIC) */}
      <Panel title="Step 1: Leaf Photo Pest Count (3 Field Samples or Insert Photo)" icon="document_scanner" className="mb-8">
        <p className="mb-4 text-xs text-muted-foreground">
          Select one of the 3 standardized Coimbatore field samples below, or upload your own leaf picture. Computer vision analyzes pest spots and calculates <code className="font-mono">jassid_per_3_leaves</code> automatically.
        </p>

        {/* 3 Preset Samples Grid */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {sampleLeaves.map((sample) => {
            const isSelected = selectedSampleId === sample.id && !customFile;
            return (
              <button
                type="button"
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                className={`flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-soft ring-2 ring-primary/20"
                    : "border-border bg-surface hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                <div className="relative mb-3 h-36 w-full overflow-hidden rounded-xl border border-border">
                  <img
                    src={sample.src}
                    alt={sample.title}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute top-2 left-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-bold text-foreground shadow-sm">
                    {sample.badge}
                  </span>
                  {isSelected ? (
                    <span className="absolute bottom-2 right-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-sm">
                      ✓ SELECTED
                    </span>
                  ) : null}
                </div>
                <p className="font-semibold text-xs text-foreground">{sample.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{sample.subtitle}</p>
                <p className="text-[10px] font-semibold text-primary mt-2">
                  {sample.expectedTag}
                </p>
              </button>
            );
          })}
        </div>

        {/* Custom Upload Dropzone */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-background/40 p-5 text-center">
            <span className="mb-2 text-2xl">📷</span>
            <p className="text-xs font-semibold text-foreground">
              Or insert custom cotton leaf picture
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
              <img
                src={previewSrc}
                alt="Selected Leaf Sample"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground">
                {customFile ? `Custom: ${customFile.name}` : sampleLeaves.find((s) => s.id === selectedSampleId)?.title || "Field Sample"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Target leaf inspection sample for automated nymph & adult count.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Metric: Jassids / 3 leaves
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Ready to stream into Model B
                </span>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* STEP 2: PIPELINE INPUTS (WEATHER API + PREVIOUS WEEK EXCEL/DB DATA) */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {/* Live Weather API */}
        <Panel title="Step 2A: Live Coimbatore Weather (Open-Meteo API)" icon="cloud">
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
          ) : (
            <div className="py-4 text-center text-xs text-muted-foreground">
              Loading Open-Meteo Coimbatore weather...
            </div>
          )}
        </Panel>

        {/* Previous Week Data from Excel / DB */}
        <Panel title="Step 2B: Previous Week Lags (Excel / SQLite DB)" icon="dataset">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              Lag features (<code className="font-mono">jassid_lag_1</code>, <code className="font-mono">jassid_lag_2</code>) automatically pulled from Excel.
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
                <span className="text-[10px] text-muted-foreground">SMW {prevWeekData.smw} ({prevWeekData.report_year})</span>
              </div>
              <div className="rounded-xl border border-border bg-background p-2.5">
                <span className="text-muted-foreground text-[10px] uppercase font-semibold">2 Weeks Ago (Lag 2)</span>
                <p className="text-sm font-semibold mt-0.5">{prevWeekData.jassid_lag_1} / 3 leaves</p>
                <span className="text-[10px] text-muted-foreground">SMW {prevWeekData.smw - 1}</span>
              </div>
              <div className="rounded-xl border border-border bg-background p-2.5">
                <span className="text-muted-foreground text-[10px] uppercase font-semibold">Prev Max Temp</span>
                <p className="text-sm font-semibold mt-0.5">{prevWeekData.max_temp_c}°C</p>
                <span className="text-[10px] text-muted-foreground">max_temp_c_lag_1</span>
              </div>
              <div className="rounded-xl border border-border bg-background p-2.5">
                <span className="text-muted-foreground text-[10px] uppercase font-semibold">Prev Morning RH</span>
                <p className="text-sm font-semibold mt-0.5">{prevWeekData.rh_morning_pct}%</p>
                <span className="text-[10px] text-muted-foreground">rh_morning_lag_1</span>
              </div>
              <div className="rounded-xl border border-border bg-background p-2.5">
                <span className="text-muted-foreground text-[10px] uppercase font-semibold">Prev Rainfall</span>
                <p className="text-sm font-semibold mt-0.5">{prevWeekData.rainfall_mm} mm</p>
                <span className="text-[10px] text-muted-foreground">rainfall_lag_1</span>
              </div>
              <div className="rounded-xl border border-border bg-background p-2.5">
                <span className="text-muted-foreground text-[10px] uppercase font-semibold">Data Source</span>
                <p className="truncate text-xs font-semibold mt-0.5" title={prevWeekData.source}>
                  {prevWeekData.source.split("(")[0]}
                </p>
                <span className="text-[10px] text-primary">AICRP Cotton Excel</span>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-muted-foreground">
              Loading historical observation from Excel...
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
          {loading ? "Analyzing Image & Forecasting Risk..." : "⚡ Predict Next-Week Risk (Image Count + Weather API + Excel Lags)"}
        </button>

        <button
          type="button"
          onClick={handlePredictLatestFromExcel}
          disabled={loading}
          className="rounded-2xl border border-border bg-surface px-5 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          {loading ? "Computing..." : "📊 Predict on Latest Excel Dataset Week"}
        </button>
      </div>

      {/* STEP 4: PREDICTION OUTPUT (UNIFIED PIPELINE) */}
      {unifiedResult ? (
        <div className="mb-8 space-y-6">
          <Panel title="Unified Prediction & Pest Risk Assessment" icon="bolt" className="border-primary/30">
            {/* Header Result Card */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
              <div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary uppercase">
                  {unifiedResult.prediction.model_used}
                </span>
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
                <span className="text-[11px] text-muted-foreground">
                  Recorded in DB: Table <code className="font-mono">predictions</code> (#ID {unifiedResult.db_record.id})
                </span>
              </div>
            </div>

            {/* Vision + Model Inputs Review */}
            <div className="my-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-surface p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Vision Detected Leaf Count</p>
                <p className="text-2xl font-bold mt-1 text-primary">
                  {unifiedResult.vision_analysis.jassid_per_3_leaves}{" "}
                  <span className="text-xs font-normal text-muted-foreground">/ 3 leaves</span>
                </p>
                <p className="text-[11px] text-foreground/70 mt-1">
                  {unifiedResult.vision_analysis.detected_spots_on_leaf} pest spots detected ({Math.round(unifiedResult.vision_analysis.confidence * 100)}% conf)
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Previous Week History (Excel)</p>
                <p className="text-2xl font-bold mt-1">
                  {unifiedResult.previous_week_data.jassid_per_3_leaves}{" "}
                  <span className="text-xs font-normal text-muted-foreground">/ 3 leaves (Lag 1)</span>
                </p>
                <p className="text-[11px] text-foreground/70 mt-1">
                  Lag 2: {unifiedResult.previous_week_data.jassid_lag_1} / 3 leaves (SMW {unifiedResult.previous_week_data.smw})
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

            {/* Canopy Symptoms Derived from Pest Count */}
            {unifiedResult.vision_analysis.symptoms && unifiedResult.vision_analysis.symptoms.length > 0 ? (
              <div className="mb-5 rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Canopy Diagnostic & Symptoms ({unifiedResult.vision_analysis.severity} Severity)
                </p>
                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  {unifiedResult.vision_analysis.symptoms.map((sym) => (
                    <div key={sym.title}>
                      <p className="font-semibold text-foreground">• {sym.title}</p>
                      <p className="text-muted-foreground mt-0.5">{sym.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Dynamic SHAP Explanations */}
            {unifiedResult.prediction.explanation && unifiedResult.prediction.explanation.length > 0 ? (
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Dynamic SHAP Feature Attributions (Factors Driving Next-Week Population)
                </p>
                <div className="space-y-2">
                  {unifiedResult.prediction.explanation.map((item) => (
                    <div key={item.feature} className="flex items-center gap-3 text-xs">
                      <span className="w-52 shrink-0 font-medium text-foreground/80">{item.feature}</span>
                      <span className="w-16 shrink-0 text-muted-foreground">
                        {item.value !== undefined ? item.value : "-"}
                      </span>
                      <div className="h-2.5 flex-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.contribution >= 0 ? "bg-risk-high" : "bg-risk-low"
                          }`}
                          style={{
                            width: `${Math.min(100, Math.max(10, Math.abs(item.contribution) * 60))}%`,
                          }}
                        />
                      </div>
                      <span
                        className={`w-16 shrink-0 text-right font-bold ${
                          item.contribution >= 0 ? "text-risk-high" : "text-risk-low"
                        }`}
                      >
                        {item.contribution >= 0 ? "+" : ""}
                        {item.contribution.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </Panel>
        </div>
      ) : null}

      {/* STEP 4B: EXCEL LATEST PREDICTION OUTPUT */}
      {excelLatestResult ? (
        <div className="mb-8 rounded-2xl border border-primary/30 bg-surface p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Latest Excel Dataset Observation Output ({excelLatestResult.model_used})
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-4xl font-extrabold">{excelLatestResult.predicted_next_week_jassid}</span>
              <span className="text-xs text-foreground/70">Jassids / 3 leaves (Next-Week)</span>
            </div>
            <span
              className={`rounded-full px-4 py-1 text-xs font-bold ${
                excelLatestResult.risk === "HIGH" ? "bg-risk-high/15 text-risk-high" : "bg-risk-low/15 text-risk-low"
              }`}
            >
              {excelLatestResult.risk} RISK
            </span>
          </div>
        </div>
      ) : null}

      {/* STEP 5: PREDICTIONS DATABASE TABLE (PERSISTENCE LOG) */}
      <Panel title="Step 4: Predictions Database Table (SQLite Persistent History)" icon="database">
        <p className="mb-4 text-xs text-muted-foreground">
          Every prediction triggered from leaf photo analysis, live weather, and Excel lags is logged directly into the <code className="font-mono">predictions</code> database table.
        </p>

        {recentPredictions.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/50 text-[10px] uppercase font-bold text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5">ID</th>
                  <th className="px-3 py-2.5">Timestamp</th>
                  <th className="px-3 py-2.5">Leaf Sample / Source</th>
                  <th className="px-3 py-2.5">Detected Jassid</th>
                  <th className="px-3 py-2.5">Prev Lags (L1 / L2)</th>
                  <th className="px-3 py-2.5">Weather (Max T / RH)</th>
                  <th className="px-3 py-2.5">Predicted Next Week</th>
                  <th className="px-3 py-2.5">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 bg-surface">
                {recentPredictions.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2 font-mono font-semibold text-primary">#{row.id}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.created_at}</td>
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
