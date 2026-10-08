import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { PageHeader, Panel, StatTile } from "@/components/procrop/ui";
import { fetchLiveCoimbatoreWeather, type LiveWeatherResponse } from "@/services/api";

export const Route = createFileRoute("/_app/environment")({
  head: () => ({
    meta: [
      { title: "Live Coimbatore Weather — ProCrop" },
      {
        name: "description",
        content:
          "Real-time daily weather inputs fetched for Coimbatore, Tamil Nadu via Open-Meteo API. Auto-refreshes every 1 hour.",
      },
      { property: "og:title", content: "Live Coimbatore Weather — ProCrop" },
      {
        property: "og:description",
        content:
          "Real-time daily weather inputs fetched for Coimbatore, Tamil Nadu via Open-Meteo API. Auto-refreshes every 1 hour.",
      },
    ],
  }),
  component: EnvironmentPage,
});

// 1 hour in milliseconds
const REFRESH_INTERVAL_MS = 60 * 60 * 1000;

export default function EnvironmentPage() {
  const [weather, setWeather] = useState<LiveWeatherResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [nextRefreshSec, setNextRefreshSec] = useState<number>(3600);

  const loadWeather = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchLiveCoimbatoreWeather();
      setWeather(data);
      setLastFetched(new Date());
      setNextRefreshSec(3600);
    } catch (err: unknown) {
      console.error("Failed to fetch live weather:", err);
      setError(
        err instanceof Error ? err.message : "Unable to reach weather API. Ensure backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and 1-hour interval
  useEffect(() => {
    loadWeather();

    const interval = setInterval(() => {
      loadWeather();
    }, REFRESH_INTERVAL_MS);

    // Countdown ticker every second for user feedback
    const countdown = setInterval(() => {
      setNextRefreshSec((prev) => (prev > 0 ? prev - 1 : 3600));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdown);
    };
  }, [loadWeather]);

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSec = secs % 60;
    return `${mins}m ${remSec < 10 ? "0" : ""}${remSec}s`;
  };

  return (
    <div className="px-5 py-8 md:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader
          eyebrow="Sense · Atmospheric Inputs"
          title="Daily Weather — Coimbatore"
          description="Real-time agronomic weather parameters retrieved via Open-Meteo API for Coimbatore, Tamil Nadu (11.0168° N, 76.9558° E). Auto-refreshes once every hour."
        />
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => loadWeather()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted disabled:opacity-50 transition-colors"
          >
            <span className={`material-symbols-outlined text-lg ${loading ? "animate-spin" : ""}`}>
              sync
            </span>
            <span>{loading ? "Refreshing..." : "Refresh now"}</span>
          </button>
        </div>
      </div>

      {/* Auto-refresh Status Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-foreground">Live Telemetry Active:</span>
          <span>Open-Meteo API (Coimbatore Coordinates)</span>
        </div>
        <div className="flex items-center gap-4">
          <span>
            Last updated:{" "}
            <strong className="text-foreground">
              {lastFetched ? lastFetched.toLocaleTimeString() : "Fetching..."}
            </strong>
          </span>
          <span>
            Next hourly refresh in:{" "}
            <strong className="font-mono text-primary">{formatCountdown(nextRefreshSec)}</strong>
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-semibold">Weather Service Connection Notice</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {weather && (
        <div className="space-y-6">
          {/* Key Weather Metric Tiles */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Today's Observed Measurements
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile
                icon="thermostat"
                label="Max Temperature"
                value={`${weather.max_temp_c}°C`}
                hint="Daily maximum peak"
              />
              <StatTile
                icon="device_thermostat"
                label="Min Temperature"
                value={`${weather.min_temp_c}°C`}
                hint="Diurnal night minimum"
              />
              <StatTile
                icon="water_drop"
                label="Morning Humidity (RH I)"
                value={`${weather.rh_morning_pct}%`}
                hint="Crucial for Jassid nymph survival"
              />
              <StatTile
                icon="humidity_low"
                label="Evening Humidity (RH II)"
                value={`${weather.rh_evening_pct}%`}
                hint="Afternoon relative humidity"
              />
              <StatTile
                icon="rainy"
                label="Precipitation"
                value={`${weather.rainfall_mm} mm`}
                hint={weather.rainfall_mm > 5 ? "High rain wash-off effect" : "Dry canopy conditions"}
              />
              <StatTile
                icon="calendar_today"
                label="Rainy Days (Week)"
                value={`${weather.rainy_days} days`}
                hint="Days with >= 2.5 mm rainfall"
              />
              <StatTile
                icon="air"
                label="Wind Speed"
                value={`${weather.wind_speed_kmh} km/h`}
                hint="Surface wind velocity at 10m"
              />
              <StatTile
                icon="wb_sunny"
                label="Bright Sunshine"
                value={`${weather.sunshine_hours} hrs`}
                hint="Photoperiod sunshine duration"
              />
            </div>
          </div>

          {/* Derived Model Features */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">functions</span>
              Model Derived Synthetic Features (Fed to XGBoost)
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border/70 bg-muted/30 p-3.5">
                <p className="text-xs text-muted-foreground font-mono">mean_temp_c</p>
                <p className="mt-1 text-xl font-bold text-foreground">
                  {weather.mean_temp_c} °C
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Arithmetic mean: (T_max {weather.max_temp_c}°C + T_min {weather.min_temp_c}°C) / 2
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/30 p-3.5">
                <p className="text-xs text-muted-foreground font-mono">mean_rh_pct</p>
                <p className="mt-1 text-xl font-bold text-foreground">
                  {weather.mean_rh_pct} %
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Mean relative humidity: (RH_morning {weather.rh_morning_pct}% + RH_evening{" "}
                  {weather.rh_evening_pct}%) / 2
                </p>
              </div>
            </div>
          </div>

          {/* Agronomic Meteorological Impact for Cotton Jassid */}
          <Panel title="Meteorological Jassid Risk Context (Coimbatore Agro-climatic Zone)" icon="biotech">
            <div className="space-y-4 text-sm text-foreground/80">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-xl shrink-0 mt-0.5">
                  wb_twilight
                </span>
                <div>
                  <h4 className="font-semibold text-foreground">Temperature & Egg Incubation</h4>
                  <p className="mt-0.5 text-muted-foreground text-xs leading-relaxed">
                    Cotton Jassids (<em>Amrasca biguttula biguttula</em>) flourish optimally when mean
                    temperatures hover between 26°C and 33°C. Current mean of {weather.mean_temp_c}°C
                    {weather.mean_temp_c >= 26 && weather.mean_temp_c <= 33
                      ? " falls directly into the high-risk proliferation bracket."
                      : " is outside the peak multiplication window."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-xl shrink-0 mt-0.5">
                  water_drop
                </span>
                <div>
                  <h4 className="font-semibold text-foreground">Relative Humidity & Nymph Longevity</h4>
                  <p className="mt-0.5 text-muted-foreground text-xs leading-relaxed">
                    Morning humidity of {weather.rh_morning_pct}%{" "}
                    {weather.rh_morning_pct > 80
                      ? "exceeds 80%, providing damp microclimate under broad leaves that prevents early-instar desiccation."
                      : "remains below critical dampness thresholds, limiting fast multiplication."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-xl shrink-0 mt-0.5">
                  thunderstorm
                </span>
                <div>
                  <h4 className="font-semibold text-foreground">Precipitation Wash-off Effect</h4>
                  <p className="mt-0.5 text-muted-foreground text-xs leading-relaxed">
                    {weather.rainfall_mm > 10
                      ? `Significant rain (${weather.rainfall_mm} mm) dislodges nymphs from the leaf undersides and knocks adults off canopy.`
                      : `Low rainfall (${weather.rainfall_mm} mm) creates dry or light moisture conditions where Jassid colonies remain undisturbed on lower leaf surfaces.`}
                  </p>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
