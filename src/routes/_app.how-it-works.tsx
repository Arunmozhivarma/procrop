import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { Icon } from "@/components/Icon";
import { fetchModelInfo, ModelInfoResponse } from "@/services/api";

export const Route = createFileRoute("/_app/how-it-works")({
  head: () => ({
    meta: [
      { title: "About & Methods — ProCrop" },
      {
        name: "description",
        content:
          "System architecture, measured machine learning metrics, datasets, expert-rule priors, and live file manifest for ProCrop Cotton Jassid intelligence.",
      },
      { property: "og:title", content: "About & Methods — ProCrop" },
    ],
  }),
  component: HowItWorksPage,
});

export default function HowItWorksPage() {
  const [data, setData] = useState<ModelInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModelInfo()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load model telemetry.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          Loading system methods & live telemetry...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-5 py-8 md:px-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Methods & Transparency"
        title="About & Methods"
        description="Comprehensive technical documentation, real cross-validation metrics, datasets, agronomic priors, and verified pipeline architecture."
      />

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-critical/30 bg-critical/10 p-4 text-sm text-critical">
          <Icon name="error" />
          <span>
            Notice: Could not load live metrics from backend. Showing baseline documentation.
          </span>
        </div>
      )}

      {/* 1. Interactive Pipeline Diagram (SVG) */}
      <Panel title="End-to-End Processing Pipeline" icon="account_tree">
        <p className="text-sm text-muted-foreground mb-6">
          Sequential execution flow from farmer photo capture to final IPM advisory. No black-box or
          mock outputs.
        </p>
        <div className="overflow-x-auto pb-4">
          <svg viewBox="0 0 1100 220" className="w-full min-w-[900px] text-xs font-medium">
            <defs>
              <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
              <linearGradient id="grad-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
              <linearGradient id="grad-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#6d28d9" />
              </linearGradient>
              <linearGradient id="grad-amber" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
            </defs>

            {/* Stage 1 */}
            <g transform="translate(10, 30)">
              <rect width="140" height="90" rx="12" fill="url(#grad-blue)" className="shadow-sm" />
              <text x="70" y="32" fill="#fff" textAnchor="middle" fontWeight="bold">
                1. Photo Upload
              </text>
              <text x="70" y="52" fill="#e0f2fe" textAnchor="middle" fontSize="10">
                5-30 Leaf Photos
              </text>
              <text x="70" y="70" fill="#bae6fd" textAnchor="middle" fontSize="9">
                Client JPEG 1600px
              </text>
            </g>
            <path d="M 155 75 L 185 75" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrow)" />

            {/* Stage 2 */}
            <g transform="translate(190, 30)">
              <rect
                width="150"
                height="90"
                rx="12"
                fill="#f8fafc"
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />
              <text x="75" y="30" fill="#0f172a" textAnchor="middle" fontWeight="bold">
                2. Quality & Vision
              </text>
              <text x="75" y="50" fill="#475569" textAnchor="middle" fontSize="10">
                Laplacian Blur &gt; 45
              </text>
              <text x="75" y="68" fill="#0284c7" textAnchor="middle" fontSize="10">
                YOLOv8n + HSV Burn
              </text>
            </g>
            <path d="M 345 75 L 375 75" stroke="#94a3b8" strokeWidth="2" />

            {/* Stage 3 */}
            <g transform="translate(380, 30)">
              <rect
                width="150"
                height="90"
                rx="12"
                fill="#f8fafc"
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />
              <text x="75" y="30" fill="#0f172a" textAnchor="middle" fontWeight="bold">
                3. Aggregation
              </text>
              <text x="75" y="50" fill="#475569" textAnchor="middle" fontSize="10">
                Mean / SD / CV / Patch
              </text>
              <text x="75" y="68" fill="#16a34a" textAnchor="middle" fontSize="10">
                Bootstrap 95% CI
              </text>
            </g>
            <path d="M 535 75 L 565 75" stroke="#94a3b8" strokeWidth="2" />

            {/* Stage 4 */}
            <g transform="translate(570, 30)">
              <rect width="150" height="90" rx="12" fill="url(#grad-emerald)" />
              <text x="75" y="30" fill="#fff" textAnchor="middle" fontWeight="bold">
                4. Weather & Lags
              </text>
              <text x="75" y="50" fill="#ecfdf5" textAnchor="middle" fontSize="10">
                Open-Meteo 7d Daily
              </text>
              <text x="75" y="68" fill="#d1fae5" textAnchor="middle" fontSize="9">
                Previous Week Lags
              </text>
            </g>
            <path d="M 725 75 L 755 75" stroke="#94a3b8" strokeWidth="2" />

            {/* Stage 5 */}
            <g transform="translate(760, 30)">
              <rect width="150" height="90" rx="12" fill="url(#grad-purple)" />
              <text x="75" y="30" fill="#fff" textAnchor="middle" fontWeight="bold">
                5. Risk Engine
              </text>
              <text x="75" y="50" fill="#f5f3ff" textAnchor="middle" fontSize="10">
                LOSOCV Model
              </text>
              <text x="75" y="68" fill="#ede9fe" textAnchor="middle" fontSize="10">
                SHAP Attributions
              </text>
            </g>
            <path d="M 915 75 L 945 75" stroke="#94a3b8" strokeWidth="2" />

            {/* Stage 6 */}
            <g transform="translate(950, 30)">
              <rect width="140" height="90" rx="12" fill="url(#grad-amber)" />
              <text x="70" y="30" fill="#fff" textAnchor="middle" fontWeight="bold">
                6. Advisory
              </text>
              <text x="70" y="50" fill="#fffbeb" textAnchor="middle" fontSize="10">
                Decision Table
              </text>
              <text x="70" y="68" fill="#fef3c7" textAnchor="middle" fontSize="9">
                Re-scout Date & Actions
              </text>
            </g>

            {/* Flow lines below */}
            <text x="550" y="165" fill="#64748b" textAnchor="middle" fontSize="11">
              Deterministic SQLite audit trail saved under per-user isolation: procrop.db
            </text>
          </svg>
        </div>
      </Panel>

      {/* 2. Step-by-Step Execution Journey */}
      <Panel title="Step-by-Step Code Journey" icon="timeline">
        <p className="text-sm text-muted-foreground mb-4">
          Exact code trace showing the real functions and files executed at each phase.
        </p>
        <div className="space-y-3">
          {(data?.pipeline_stages || []).map((st) => (
            <div
              key={st.step}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl border border-border bg-surface p-4 gap-3"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {st.step}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{st.name}</p>
                  <p className="text-xs text-muted-foreground">{st.description}</p>
                </div>
              </div>
              <div className="flex flex-col sm:items-end text-xs font-mono text-primary/80 bg-primary/5 px-2.5 py-1.5 rounded-lg border border-primary/10 shrink-0">
                <span>{st.file}</span>
                <span className="text-[10px] text-muted-foreground">{st.function}()</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* 3. Live Measured Models & Cross-Validation Metrics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Risk Model & LOSOCV Metrics" icon="psychology">
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Validation Protocol:</span>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  Leave-One-Season-Out (4 Folds)
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Evaluated strictly across unseen cotton seasons (2020-21, 2022, 2023, 2024). Target
                unit is standardized Jassid count per 3 leaves.
              </p>
            </div>

            <div className="rounded-xl border border-border p-4 space-y-2">
              <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Regression Models vs Persistence Baseline
              </p>
              <div className="space-y-1.5 text-xs">
                {Object.entries(data?.risk_metrics?.regression_models_losocv || {}).map(
                  ([mName, mScore]) => (
                    <div
                      key={mName}
                      className="flex items-center justify-between py-1 border-b border-border/50 last:border-0"
                    >
                      <span className="font-medium text-foreground">
                        {mName.replace(/_/g, " ").toUpperCase()}
                      </span>
                      <span className="font-mono text-muted-foreground">
                        MAE: <strong className="text-foreground">{mScore.mae}</strong> | RMSE:{" "}
                        {mScore.rmse}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border p-4 space-y-2">
              <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Classification Accuracy (Low / Med / High)
              </p>
              <div className="space-y-1.5 text-xs">
                {Object.entries(data?.risk_metrics?.classification_models_losocv || {}).map(
                  ([mName, mScore]) => (
                    <div
                      key={mName}
                      className="flex items-center justify-between py-1 border-b border-border/50 last:border-0"
                    >
                      <span className="font-medium text-foreground">
                        {mName.replace(/_/g, " ").toUpperCase()}
                      </span>
                      <span className="font-mono text-muted-foreground">
                        Acc:{" "}
                        <strong className="text-foreground">
                          {(mScore.accuracy * 100).toFixed(1)}%
                        </strong>{" "}
                        | Macro F1: {mScore.macro_f1}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground italic border-l-2 border-primary/40 pl-3">
              {data?.risk_metrics?.honest_assessment}
            </p>
          </div>
        </Panel>

        <Panel title="Vision Models & Quality Metrics" icon="visibility">
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Object Detector:</span>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {data?.detector_metrics?.model_architecture || "YOLOv8n"}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Trained on CC BY 4.0 cotton jassid annotations, evaluated on held-out test split.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-border p-3 bg-surface">
                <p className="text-muted-foreground">Test Precision</p>
                <p className="text-lg font-bold text-foreground">
                  {data?.detector_metrics?.held_out_test_metrics?.precision
                    ? (data.detector_metrics.held_out_test_metrics.precision * 100).toFixed(1) + "%"
                    : "86.3%"}
                </p>
              </div>
              <div className="rounded-xl border border-border p-3 bg-surface">
                <p className="text-muted-foreground">Test Recall</p>
                <p className="text-lg font-bold text-foreground">
                  {data?.detector_metrics?.held_out_test_metrics?.recall
                    ? (data.detector_metrics.held_out_test_metrics.recall * 100).toFixed(1) + "%"
                    : "35.1%"}
                </p>
              </div>
              <div className="rounded-xl border border-border p-3 bg-surface">
                <p className="text-muted-foreground">mAP@0.5</p>
                <p className="text-lg font-bold text-foreground">
                  {data?.detector_metrics?.held_out_test_metrics?.mAP_50 || "0.420"}
                </p>
              </div>
              <div className="rounded-xl border border-border p-3 bg-surface">
                <p className="text-muted-foreground">Count MAE / Leaf</p>
                <p className="text-lg font-bold text-foreground">
                  {data?.detector_metrics?.held_out_test_metrics?.count_mae_per_image
                    ?.total_pest_mae || "0.474"}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Hopper Burn Grading Scale
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                Standard: <strong>ICCC / Sikka et al. Indian Cotton Scale (Grades 0 to 4)</strong>{" "}
                via edge-weighted distance transform and margin HSV chlorosis/necrosis segmentation.
              </p>
              <div className="text-xs space-y-1">
                <div className="flex justify-between py-0.5 border-b border-border/40">
                  <span className="font-medium">Grade 0</span>
                  <span className="text-muted-foreground">
                    Healthy, flat, zero margin chlorosis
                  </span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-border/40">
                  <span className="font-medium">Grade 1</span>
                  <span className="text-muted-foreground">Mild marginal yellowing &lt; 24%</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-border/40">
                  <span className="font-medium text-amber-600 font-semibold">Grade 2</span>
                  <span className="text-muted-foreground">
                    Pronounced yellowing, cupping, bronzing initiation
                  </span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-border/40">
                  <span className="font-medium text-critical">Grade 3</span>
                  <span className="text-muted-foreground">
                    Severe widespread reddening & margin necrosis
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="font-medium text-critical font-bold">Grade 4</span>
                  <span className="text-muted-foreground">
                    Extreme scorching, complete desiccation & defoliation
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* 4. Datasets & Provenance Registry */}
      <Panel title="Datasets & Attribution Registry" icon="storage">
        <p className="text-sm text-muted-foreground mb-4">
          All data used across training, validation, and benchmarking with original sources and
          licenses.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider">
                <th className="p-3">Dataset Name</th>
                <th className="p-3">Source & Citation</th>
                <th className="p-3">License</th>
                <th className="p-3">Size & Observations</th>
                <th className="p-3">Purpose in ProCrop</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {(data?.datasets || []).map((ds) => (
                <tr key={ds.name} className="hover:bg-muted/20">
                  <td className="p-3 font-semibold text-foreground">{ds.name}</td>
                  <td className="p-3 text-muted-foreground">{ds.source}</td>
                  <td className="p-3">
                    <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700">
                      {ds.license}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">{ds.size}</td>
                  <td className="p-3 text-foreground/80">{ds.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* 5. Limitations & Transparency Notice */}
      <Panel title="Known Limitations & Agronomic Notice" icon="warning">
        <div className="space-y-2 text-sm text-muted-foreground">
          {(data?.limitations || []).map((lim, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <Icon name="check_circle" className="text-primary mt-0.5 text-base shrink-0" />
              <span>{lim}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* 6. Live File Map & Architecture Check */}
      <Panel title="Verified System File Manifest" icon="folder">
        <p className="text-sm text-muted-foreground mb-4">
          Direct verification that every backend and frontend component listed in the architecture
          documentation exists in the repo.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {(data?.file_map || []).map((fm) => (
            <div
              key={fm.path}
              className="flex items-start justify-between rounded-xl border border-border bg-surface p-3 text-xs"
            >
              <div>
                <p className="font-mono font-semibold text-foreground">{fm.path}</p>
                <p className="mt-1 text-muted-foreground">{fm.role}</p>
              </div>
              <span
                className={`shrink-0 ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${fm.exists ? "bg-emerald-500/10 text-emerald-700" : "bg-critical/10 text-critical"}`}
              >
                {fm.exists ? "EXISTS" : "MISSING"}
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
