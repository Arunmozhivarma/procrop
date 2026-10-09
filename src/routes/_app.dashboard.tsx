import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import {
  PageHeader,
  Panel,
  ScoreRing,
  StatTile,
} from "@/components/procrop/ui";
import {
  alerts,
  platformScores,
  recommendations,
  riskFromScore,
} from "@/lib/procrop-data";
import { fetchLiveCoimbatoreWeather, LiveWeatherResponse } from "@/services/api";

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

function DashboardPage() {
  const [weather, setWeather] = useState<LiveWeatherResponse | null>(null);

  useEffect(() => {
    fetchLiveCoimbatoreWeather()
      .then((res) => setWeather(res))
      .catch(() => null);
  }, []);

  const criticalAction = recommendations.find((r) => r.priority === "critical") ?? recommendations[0];
  const pendingActions = recommendations.filter((r) => r.status === "pending");
  const activeAlerts = alerts.filter((a) => !a.read);

  return (
    <div className="space-y-6 px-5 py-8 md:px-8 max-w-7xl mx-auto">
      {/* Crisp, uncluttered header */}
      <PageHeader
        eyebrow="Monitor · Coimbatore Cotton Surveillance"
        title="Cotton Jassid Intelligence"
        description="Next-week pest risk forecasting and real-time field surveillance for Coimbatore cotton."
        actions={
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <Icon name="calendar_today" className="text-[14px]" />
              SMW 37 · Forecast: SMW 38
            </span>
            <Link
              to="/risk"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary/90"
            >
              <Icon name="bolt" className="text-[14px]" />
              Run Predictor
            </Link>
          </div>
        }
      />

      {/* Hero Next-Week Forecast Banner (Executive Status Card) */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface via-surface to-primary/5 p-6 shadow-soft">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-critical opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-critical" />
              </span>
              <span className="font-semibold text-xs uppercase tracking-wider text-critical">
                Next-Week Forecast · Elevated Pressure Zone
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-display text-3xl sm:text-4xl font-extrabold text-foreground">
                HIGH RISK FORECAST
              </span>
              <span className="text-sm font-medium text-foreground/75">
                (Predicted <strong className="text-foreground">2.47</strong> Jassids / 3 leaves vs 1.95 threshold)
              </span>
            </div>

            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              XGBoost Model B projects upward population trajectory driven by warm daytime temperatures ({weather ? `${weather.max_temp_c}°C` : "34°C"}) and recent nymph emergence on lower canopy foliage.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Link
              to="/risk"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:scale-[1.02]"
            >
              <Icon name="document_scanner" className="text-[16px]" />
              Analyze Leaf Photo & Predict
            </Link>
          </div>
        </div>
      </div>

      {/* 3 Focused, Clean Key Metric Cards (No redundant badges) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          icon="pest_control"
          label="Current Pest Count"
          value="2.1"
          unit="/ 3 leaves"
          hint="Threshold: 1.95 · Slightly above ETL"
          to="/risk"
        />

        <StatTile
          icon="cloud"
          label="Live Coimbatore Weather"
          value={weather ? `${weather.max_temp_c}°C` : "34.2°C"}
          unit={weather ? `· ${weather.rh_morning_pct}% RH` : "· 67% RH"}
          hint={weather ? `Rain: ${weather.rainfall_mm}mm · Wind: ${weather.wind_speed_kmh}km/h` : "Open-Meteo live feed"}
          to="/environment"
        />

        <StatTile
          icon="checklist"
          label="Recommended Action"
          value="Neem Bio-Spray"
          unit="within 48h"
          hint="Target early nymphs on underleaf"
          to="/recommendations"
        />
      </div>

      {/* Two Balanced, High-Clarity Panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Panel: Risk Score & 3-Week Trajectory */}
        <Panel
          title="Jassid Population Progression"
          subtitle="Chronological pest dynamics and ML forecast"
          icon="show_chart"
          action={
            <Link
              to="/risk"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Model details
              <Icon name="arrow_forward" className="text-[14px]" />
            </Link>
          }
        >
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
              <ScoreRing
                value={platformScores.pest}
                level={riskFromScore(100 - platformScores.pest)}
                size={135}
                stroke={12}
                label="Risk Score"
                sublabel="High Risk"
              />

              {/* 3-Point Chronological Progression Strip */}
              <div className="w-full flex-1 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  3-Week Chronological Trend (Jassids / 3 leaves)
                </p>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl border border-border bg-background/50 p-2.5">
                    <span className="text-[10px] text-muted-foreground">Prev Week</span>
                    <p className="text-sm font-bold text-foreground mt-0.5">1.10</p>
                    <span className="text-[10px] text-vitality font-medium">Mild</span>
                  </div>

                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-2.5">
                    <span className="text-[10px] text-primary font-semibold">Current</span>
                    <p className="text-sm font-extrabold text-foreground mt-0.5">2.10</p>
                    <span className="text-[10px] text-accent font-semibold">Over ETL</span>
                  </div>

                  <div className="rounded-xl border border-critical/30 bg-critical/5 p-2.5">
                    <span className="text-[10px] text-critical font-semibold">Forecast</span>
                    <p className="text-sm font-extrabold text-critical mt-0.5">2.47</p>
                    <span className="text-[10px] text-critical font-bold">High Risk</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>Ensemble Confidence: <strong className="text-foreground">88%</strong></span>
                  <span>Primary Driver: <strong className="text-foreground">Daytime Temp</strong></span>
                </div>
              </div>
            </div>

            {/* Quick action bar */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-xs">
              <span className="text-foreground/75">
                Need fresh field diagnosis?
              </span>
              <Link
                to="/risk"
                className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                Inspect field leaf photo
                <Icon name="arrow_forward" className="text-[13px]" />
              </Link>
            </div>
          </div>
        </Panel>

        {/* Right Panel: Priority Actions & Critical Alerts (Compact Feed) */}
        <Panel
          title="Field Interventions & Alerts"
          subtitle="Immediate scouting tasks and real-time triggers"
          icon="task_alt"
          action={
            <Link
              to="/recommendations"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              All actions ({pendingActions.length})
              <Icon name="arrow_forward" className="text-[14px]" />
            </Link>
          }
        >
          <div className="space-y-4">
            {/* Top 2 Action Items (Crisp, single-line format) */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Priority Scouting Tasks
              </p>

              {recommendations.slice(0, 2).map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 p-3 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon name={rec.icon ?? "checklist"} className="text-[15px]" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">{rec.title}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{rec.summary}</p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      rec.priority === "critical"
                        ? "bg-critical/15 text-critical"
                        : "bg-warning/20 text-accent"
                    }`}
                  >
                    {rec.window}
                  </span>
                </div>
              ))}
            </div>

            {/* Top 2 Field Alerts (Compact feed) */}
            <div className="space-y-2 pt-1 border-t border-border/60">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Recent Alerts ({activeAlerts.length} active)
                </p>
                <Link
                  to="/alerts"
                  className="text-[11px] text-primary hover:underline"
                >
                  View all
                </Link>
              </div>

              {alerts.slice(0, 2).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        alert.severity === "critical"
                          ? "bg-critical"
                          : alert.severity === "high"
                            ? "bg-accent"
                            : "bg-vitality"
                      }`}
                    />
                    <p className="truncate text-xs font-medium text-foreground">{alert.title}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground">Today</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* Discreet research threshold footnote */}
      <div className="text-center pt-2">
        <p className="text-[11px] text-muted-foreground/80">
          Research note: The cutoff of <span className="font-medium text-foreground/70">≥ 1.95 Jassids per 3 leaves</span> is a median-derived rule on Coimbatore AICRP data (not official ICAR ETL).
        </p>
      </div>
    </div>
  );
}
