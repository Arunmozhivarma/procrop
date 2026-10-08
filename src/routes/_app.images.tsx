import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel } from "@/components/procrop/ui";
import {
  autoPredictFromPhotoAndWeather,
  AutoPredictResponse,
} from "@/services/api";

export const Route = createFileRoute("/_app/images")({
  head: () => ({
    meta: [
      { title: "Leaf Photo Pest Analysis — ProCrop" },
      {
        name: "description",
        content:
          "Automatic Cotton Jassid pest detection from leaf photo upload combined with real-time Coimbatore weather.",
      },
      { property: "og:title", content: "Leaf Photo Pest Analysis — ProCrop" },
      {
        property: "og:description",
        content:
          "Automatic Cotton Jassid pest detection from leaf photo upload combined with real-time Coimbatore weather.",
      },
    ],
  }),
  component: ImagesPage,
});

const sampleDemos = [
  {
    id: "sample-heavy",
    title: "Cotton Leaf — Field Sample A",
    subtitle: "Canopy underside scan · Coimbatore Block 1",
    src: "/sample-leaves/jassid_heavy_sample.jpg",
    fileName: "jassid_heavy_sample.jpg",
    badge: "SAMPLE LEAF A",
    tone: "border-border bg-surface hover:border-primary/50",
  },
  {
    id: "sample-moderate",
    title: "Cotton Leaf — Field Sample B",
    subtitle: "Canopy underside scan · Coimbatore Block 2",
    src: "/sample-leaves/jassid_moderate_sample.jpg",
    fileName: "jassid_moderate_sample.jpg",
    badge: "SAMPLE LEAF B",
    tone: "border-border bg-surface hover:border-primary/50",
  },
  {
    id: "sample-mild",
    title: "Cotton Leaf — Field Sample C",
    subtitle: "Canopy underside scan · Coimbatore Block 3",
    src: "/sample-leaves/jassid_mild_sample.jpg",
    fileName: "jassid_mild_sample.jpg",
    badge: "SAMPLE LEAF C",
    tone: "border-border bg-surface hover:border-primary/50",
  },
];

function ImagesPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [autoResult, setAutoResult] = useState<AutoPredictResponse | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setAutoResult(null);
      setErrorMsg(null);
    }
  };

  const handleSelectDemoSample = async (demo: typeof sampleDemos[0]) => {
    setLoading(true);
    setErrorMsg(null);
    setAutoResult(null);
    try {
      const response = await fetch(demo.src);
      const blob = await response.blob();
      const file = new File([blob], demo.fileName, { type: "image/jpeg" });

      setSelectedFile(file);
      setImagePreview(demo.src);

      const res = await autoPredictFromPhotoAndWeather(file);
      setAutoResult(res);
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          "Could not connect to FastAPI backend at http://localhost:8000. Ensure uvicorn server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzePhoto = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await autoPredictFromPhotoAndWeather(selectedFile);
      setAutoResult(res);
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
        title="Leaf Photo Pest Detection & Live Weather Integration"
        description="Farmers upload a cotton leaf photo or select a field sample below — computer vision automatically counts Jassid pests, retrieves real-time Coimbatore weather, and runs XGBoost for next-week risk prediction."
      />

      {/* Field Sample Photo Gallery (Count-neutral before prediction) */}
      <div className="mb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Select any cotton leaf field photo below to test pest detection &amp; live weather prediction:
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {sampleDemos.map((demo) => (
            <button
              type="button"
              key={demo.id}
              onClick={() => handleSelectDemoSample(demo)}
              disabled={loading}
              className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-all hover:shadow-soft hover:scale-[1.01] ${demo.tone}`}
            >
              <div className="relative mb-3 h-40 w-full overflow-hidden rounded-xl border border-border">
                <img
                  src={demo.src}
                  alt={demo.title}
                  className="h-full w-full object-cover"
                />
                <span className="absolute top-2 left-2 rounded-full bg-background/90 px-2.5 py-0.5 text-[10px] font-bold text-foreground shadow-sm">
                  {demo.badge}
                </span>
              </div>
              <p className="font-semibold text-sm text-foreground">{demo.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{demo.subtitle}</p>
              <span className="mt-3 text-xs font-semibold text-primary underline">
                ⚡ Click to test prediction →
              </span>
            </button>
          ))}
        </div>
      </div>

      <Panel title="Custom Cotton Leaf Photo Upload" icon="add_a_photo" className="mb-8">
        <p className="mb-4 text-xs text-muted-foreground">
          Upload any cotton leaf photo from your device.
          Computer vision will detect Jassid nymphs/adults, compute <code className="font-mono">jassid_per_3_leaves</code>,
          and query live Open-Meteo weather for Coimbatore.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Upload Zone */}
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-6 text-center bg-background/50">
            {imagePreview ? (
              <div className="relative w-full max-w-xs overflow-hidden rounded-xl border border-border">
                <img
                  src={imagePreview}
                  alt="Uploaded Cotton Leaf"
                  className="h-56 w-full object-cover"
                />
              </div>
            ) : (
              <div className="py-8">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto">
                  📷
                </span>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  Click to select cotton leaf photo
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports JPG, PNG formats
                </p>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="mt-4 block w-full text-xs text-muted-foreground file:mr-4 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2 file:text-xs file:font-semibold file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
            />

            {selectedFile ? (
              <button
                type="button"
                onClick={handleAnalyzePhoto}
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {loading
                  ? "Analyzing Leaf & Fetching Live Weather..."
                  : "⚡ Analyze Photo & Predict Next-Week Risk"}
              </button>
            ) : null}
          </div>

          {/* Guidelines */}
          <div className="space-y-3 rounded-2xl border border-border bg-surface p-5 text-sm">
            <p className="font-semibold text-foreground">How Automated Detection Works:</p>
            <ol className="list-decimal pl-4 space-y-2 text-xs text-foreground/80">
              <li>
                <strong>Computer Vision Pest Count:</strong> Scans leaf surface for pale-green Jassid nymphs/adults and calculates <span className="font-mono">jassid_per_3_leaves</span>.
              </li>
              <li>
                <strong>Live Open-Meteo Weather API:</strong> Automatically fetches current max/min temperature, morning/evening humidity, rainfall, and sunshine hours for Coimbatore.
              </li>
              <li>
                <strong>XGBoost Model Execution:</strong> Feeds detected pest count + live weather into Model B to predict next-week risk and calculate SHAP feature contributions.
              </li>
            </ol>
          </div>
        </div>

        {errorMsg ? (
          <div className="mt-4 rounded-xl border border-critical/30 bg-critical/10 p-3 text-xs text-critical">
            ⚠️ {errorMsg}
          </div>
        ) : null}
      </Panel>

      {/* Analysis & Automated Prediction Output */}
      {autoResult ? (
        <div className="space-y-6">
          <Panel title="Computer Vision Pest Detection Output" icon="document_scanner">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Detected Pest Spots</p>
                <p className="font-display text-3xl font-semibold mt-1">
                  {autoResult.vision_analysis.detected_spots_on_leaf}
                </p>
                <p className="text-xs text-foreground/70 mt-1">
                  Pest spots on uploaded leaf sample
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Standardized Metric</p>
                <p className="font-display text-3xl font-semibold mt-1 text-primary">
                  {autoResult.vision_analysis.jassid_per_3_leaves}
                </p>
                <p className="text-xs text-foreground/70 mt-1">
                  Calculated Jassids / 3 leaves
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Detection Confidence</p>
                <p className="font-display text-3xl font-semibold mt-1">
                  {Math.round(autoResult.vision_analysis.confidence * 100)}%
                </p>
                <p className="text-xs text-foreground/70 mt-1">
                  Model diagnosis: {autoResult.vision_analysis.severity} severity
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Pest Symptoms &amp; Canopy Damage (Derived from Severity)
              </p>
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                {autoResult.vision_analysis.symptoms.map((s) => (
                  <div key={s.title}>
                    <p className="font-semibold text-foreground">• {s.title}</p>
                    <p className="text-muted-foreground mt-0.5">{s.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Real-Time Open-Meteo Weather (Coimbatore)" icon="cloud">
            <div className="grid gap-3 sm:grid-cols-4 text-xs">
              <div className="rounded-xl border border-border p-3">
                <p className="text-muted-foreground">Max Temp (°C)</p>
                <p className="font-display text-xl font-semibold mt-1">{autoResult.live_weather.max_temp_c} °C</p>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-muted-foreground">Min Temp (°C)</p>
                <p className="font-display text-xl font-semibold mt-1">{autoResult.live_weather.min_temp_c} °C</p>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-muted-foreground">RH Morning (%)</p>
                <p className="font-display text-xl font-semibold mt-1">{autoResult.live_weather.rh_morning_pct}%</p>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-muted-foreground">Rainfall (mm)</p>
                <p className="font-display text-xl font-semibold mt-1">{autoResult.live_weather.rainfall_mm} mm</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground italic">
              Source: {autoResult.live_weather.source} ({autoResult.live_weather.timestamp})
            </p>
          </Panel>

          <Panel title="Integrated Next-Week XGBoost Risk Forecast" icon="readiness_score">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Predicted Next-Week Jassid Population
                </p>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="font-display text-4xl font-semibold">
                    {autoResult.prediction.predicted_next_week_jassid}
                  </span>
                  <span className="text-sm text-foreground/70">Jassids / 3 leaves</span>
                </div>
              </div>
              <div>
                <span
                  className={`rounded-full px-4 py-2 text-sm font-bold ${
                    autoResult.prediction.risk === "HIGH"
                      ? "bg-risk-high/15 text-risk-high"
                      : "bg-risk-low/15 text-risk-low"
                  }`}
                >
                  {autoResult.prediction.risk} RISK (Threshold ≥ {autoResult.prediction.risk_threshold})
                </span>
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                SHAP Feature Attributions for Deployed XGBoost Model
              </p>
              <div className="space-y-2">
                {autoResult.prediction.explanation.map((c) => (
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
          </Panel>
        </div>
      ) : null}
    </div>
  );
}
