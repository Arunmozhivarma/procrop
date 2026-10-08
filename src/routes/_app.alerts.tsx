import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { PageHeader, Panel, RiskBadge } from "@/components/procrop/ui";
import { fetchLiveCoimbatoreWeather, type LiveWeatherResponse } from "@/services/api";

export const Route = createFileRoute("/_app/alerts")({
  head: () => ({
    meta: [
      { title: "Weather Alerts — ProCrop" },
      {
        name: "description",
        content:
          "Agronomic weather anomaly warnings for Coimbatore cotton based on real-time Open-Meteo weather features.",
      },
      { property: "og:title", content: "Weather Alerts — ProCrop" },
      {
        property: "og:description",
        content:
          "Agronomic weather anomaly warnings for Coimbatore cotton based on real-time Open-Meteo weather features.",
      },
    ],
  }),
  component: AlertsPage,
});

interface WeatherAlert {
  id: string;
  feature: string;
  observedValue: string;
  threshold: string;
  severity: "critical" | "high" | "moderate" | "low";
  title: string;
  description: string;
  agronomicAction: string;
  icon: string;
}

export default function AlertsPage() {
  const [weather, setWeather] = useState<LiveWeatherResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const evaluateWeatherAlerts = (data: LiveWeatherResponse) => {
    const detectedAlerts: WeatherAlert[] = [];

    // 1. Extreme Temperature Check (> 35°C or < 20°C)
    if (data.max_temp_c >= 35) {
      detectedAlerts.push({
        id: "temp-extreme-high",
        feature: "Max Temperature",
        observedValue: `${data.max_temp_c} °C`,
        threshold: "> 35.0 °C",
        severity: "critical",
        title: "Extreme Canopy Heat Spike",
        description: `Max temperature reached ${data.max_temp_c}°C. High heat stresses squaring cotton plants and accelerates moisture evaporation from upper leaf surfaces.`,
        agronomicAction:
          "Provide light evening irrigation to avert moisture stress. Avoid middle-of-the-day foliar sprays to prevent chemical leaf scorch.",
        icon: "local_fire_department",
      });
    } else if (data.max_temp_c >= 33.5) {
      detectedAlerts.push({
        id: "temp-elevated",
        feature: "Max Temperature",
        observedValue: `${data.max_temp_c} °C`,
        threshold: "> 33.5 °C",
        severity: "moderate",
        title: "Elevated Daytime Temperature",
        description: `Temperature at ${data.max_temp_c}°C creates warm microclimates favoring rapid insect metabolic turnover.`,
        agronomicAction: "Scout leaf undersides in the early morning before midday heat pushes nymphs into deep foliage.",
        icon: "thermostat",
      });
    }

    // 2. High Relative Humidity Anomaly (Morning RH > 85%)
    if (data.rh_morning_pct >= 88) {
      detectedAlerts.push({
        id: "rh-extreme-high",
        feature: "Morning Relative Humidity",
        observedValue: `${data.rh_morning_pct} %`,
        threshold: "> 88.0 %",
        severity: "critical",
        title: "Hyper-Humid Morning Surge — Peak Jassid Incubation",
        description: `Morning relative humidity has surged to ${data.rh_morning_pct}%. Saturated microclimates prevent early-instar Jassid nymph desiccation and accelerate hatching.`,
        agronomicAction:
          "High priority for suction trap monitoring and yellow sticky card installation. Prepare biological or targeted systemic insecticides if population breaches ETL.",
        icon: "water_drop",
      });
    } else if (data.rh_morning_pct >= 80) {
      detectedAlerts.push({
        id: "rh-moderate-high",
        feature: "Morning Relative Humidity",
        observedValue: `${data.rh_morning_pct} %`,
        threshold: ">= 80.0 %",
        severity: "high",
        title: "Elevated Morning Humidity",
        description: `Morning RH of ${data.rh_morning_pct}% creates favorable conditions for sucking pests and fungal foliar pathogens.`,
        agronomicAction: "Inspect lower and middle third leaves for early marginal curling (hopperburn).",
        icon: "humidity_mid",
      });
    }

    // 3. High Surface Wind (> 12 km/h)
    if (data.wind_speed_kmh >= 14) {
      detectedAlerts.push({
        id: "wind-high",
        feature: "Wind Speed",
        observedValue: `${data.wind_speed_kmh} km/h`,
        threshold: ">= 14.0 km/h",
        severity: "high",
        title: "High Wind Velocity — Spray Drift Hazard",
        description: `Sustained wind speeds at ${data.wind_speed_kmh} km/h can blow spray droplet clouds away from target foliage and waste pesticide.`,
        agronomicAction:
          "Halt all knapsack or tractor-mounted canopy spraying until winds taper below 10 km/h to prevent non-target drift.",
        icon: "air",
      });
    } else if (data.wind_speed_kmh >= 11) {
      detectedAlerts.push({
        id: "wind-moderate",
        feature: "Wind Speed",
        observedValue: `${data.wind_speed_kmh} km/h`,
        threshold: ">= 11.0 km/h",
        severity: "low",
        title: "Breezy Conditions",
        description: `Winds of ${data.wind_speed_kmh} km/h may cause mild drift during mist spraying.`,
        agronomicAction: "Use drift-reducing nozzles or spray early in the morning when winds are calm.",
        icon: "air",
      });
    }

    // 4. Excessive Precipitation / Downpour (> 15 mm)
    if (data.rainfall_mm >= 25) {
      detectedAlerts.push({
        id: "rain-heavy",
        feature: "Rainfall",
        observedValue: `${data.rainfall_mm} mm`,
        threshold: ">= 25.0 mm",
        severity: "critical",
        title: "Heavy Rainfall Event — Chemical Wash-off & Waterlogging Risk",
        description: `Recorded precipitation of ${data.rainfall_mm} mm will wash off foliar contact sprays and can cause root asphyxiation in heavy Vertisols.`,
        agronomicAction:
          "Postpone chemical applications by 48 hours. Ensure field drainage furrows are open in black cotton soil blocks.",
        icon: "thunderstorm",
      });
    } else if (data.rainfall_mm >= 12) {
      detectedAlerts.push({
        id: "rain-moderate",
        feature: "Rainfall",
        observedValue: `${data.rainfall_mm} mm`,
        threshold: ">= 12.0 mm",
        severity: "high",
        title: "Moderate Rainfall — Natural Pest Dislodgement",
        description: `Rainfall of ${data.rainfall_mm} mm will mechanically wash off young Jassid nymphs from upper leaf surfaces.`,
        agronomicAction: "Delay pesticide re-sprays until leaves dry completely and new scouting is conducted.",
        icon: "rainy",
      });
    }

    // 5. Cloud Cover / Low Sunshine Hours (< 3.0 hrs)
    if (data.sunshine_hours <= 2.5) {
      detectedAlerts.push({
        id: "sunshine-low",
        feature: "Sunshine Duration",
        observedValue: `${data.sunshine_hours} hrs`,
        threshold: "<= 2.5 hrs",
        severity: "low",
        title: "Overcast Conditions & Reduced Sunshine",
        description: `Only ${data.sunshine_hours} hours of bright sunshine recorded today. Extended gloom dampens photosynthesis and shields nymphs from solar UV drying.`,
        agronomicAction: "Maintain field scouting; nymph survivorship increases during cloudy spells.",
        icon: "cloud",
      });
    }

    setAlerts(detectedAlerts);
  };

  const loadWeatherAndCheck = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchLiveCoimbatoreWeather();
      setWeather(data);
      evaluateWeatherAlerts(data);
      setLastChecked(new Date());
    } catch (err: unknown) {
      console.error("Failed to load weather for alerts:", err);
      setError(err instanceof Error ? err.message : "Unable to retrieve weather data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeatherAndCheck();
  }, [loadWeatherAndCheck]);

  return (
    <div className="px-5 py-8 md:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader
          eyebrow="Act · Real-Time Triggers"
          title="Weather Anomaly Alerts"
          description="Automated alerts generated when live Open-Meteo weather features for Coimbatore breach critical agronomic thresholds for cotton and Jassid dynamics."
        />
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => loadWeatherAndCheck()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted disabled:opacity-50 transition-colors"
          >
            <span className={`material-symbols-outlined text-lg ${loading ? "animate-spin" : ""}`}>
              sync
            </span>
            <span>{loading ? "Checking..." : "Recheck Weather"}</span>
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        <div>
          <span>Target Region: </span>
          <strong className="text-foreground">Coimbatore, Tamil Nadu</strong>
        </div>
        <div>
          <span>Last Evaluation: </span>
          <strong className="text-foreground">
            {lastChecked ? lastChecked.toLocaleTimeString() : "Pending"}
          </strong>
        </div>
        <div>
          <span>Alerts Triggered: </span>
          <strong className={alerts.length > 0 ? "text-amber-500 font-bold" : "text-emerald-500 font-bold"}>
            {alerts.length} Active Notice{alerts.length === 1 ? "" : "s"}
          </strong>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-semibold">Weather API Connection Issue</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {/* If No Abnormalities Detected */}
      {!loading && alerts.length === 0 && weather && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
          <span className="material-symbols-outlined text-emerald-500 text-5xl">check_circle</span>
          <h3 className="mt-3 text-lg font-bold text-foreground">
            All Weather Parameters Within Normal Agronomic Range
          </h3>
          <p className="mt-2 mx-auto max-w-lg text-sm text-muted-foreground">
            All current Open-Meteo telemetry readings for Coimbatore (Temp: {weather.max_temp_c}°C /{" "}
            {weather.min_temp_c}°C, Morning RH: {weather.rh_morning_pct}%, Wind: {weather.wind_speed_kmh} km/h,
            Rain: {weather.rainfall_mm} mm) are within safe agronomic boundaries. No immediate weather hazards detected.
          </p>
        </div>
      )}

      {/* Render Alert Cards */}
      <div className="space-y-4">
        {alerts.map((a) => (
          <Panel
            key={a.id}
            title={a.title}
            subtitle={`Trigger: ${a.feature} (${a.observedValue}) breached safe threshold (${a.threshold})`}
            icon={a.icon}
          >
            <p className="text-sm leading-relaxed text-foreground/80">{a.description}</p>

            <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3 text-xs">
              <span className="font-bold text-primary">Required Action: </span>
              <span className="text-foreground/90">{a.agronomicAction}</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <RiskBadge level={a.severity} />
              <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-foreground/70">
                Observed: {a.observedValue}
              </span>
              <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                Safe limit: {a.threshold}
              </span>
            </div>
          </Panel>
        ))}
      </div>

      {/* Threshold Reference Table */}
      <div className="mt-8">
        <Panel title="Weather Anomaly Threshold Reference Guidelines" icon="tune">
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="py-2.5 px-3">Weather Parameter</th>
                  <th className="py-2.5 px-3">Normal Safe Range</th>
                  <th className="py-2.5 px-3">Alert Threshold</th>
                  <th className="py-2.5 px-3">Agronomic Impact on Cotton & Jassid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-foreground/80">
                <tr>
                  <td className="py-2 px-3 font-medium">Max Temperature</td>
                  <td className="py-2 px-3 text-emerald-600">26.0 – 33.0 °C</td>
                  <td className="py-2 px-3 text-destructive font-semibold">&gt; 35.0 °C</td>
                  <td className="py-2 px-3 text-muted-foreground">Leaf scorching, moisture stress, altered pest oviposition</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Morning Relative Humidity</td>
                  <td className="py-2 px-3 text-emerald-600">60.0 – 78.0 %</td>
                  <td className="py-2 px-3 text-destructive font-semibold">&gt; 85.0 %</td>
                  <td className="py-2 px-3 text-muted-foreground">High nymph emergence rate and leafhopper survival</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Wind Speed</td>
                  <td className="py-2 px-3 text-emerald-600">2.0 – 10.0 km/h</td>
                  <td className="py-2 px-3 text-destructive font-semibold">&gt; 12.0 km/h</td>
                  <td className="py-2 px-3 text-muted-foreground">Pesticide spray drift, uneven droplet distribution</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Daily Precipitation</td>
                  <td className="py-2 px-3 text-emerald-600">0.0 – 8.0 mm</td>
                  <td className="py-2 px-3 text-destructive font-semibold">&gt; 15.0 mm</td>
                  <td className="py-2 px-3 text-muted-foreground">Wash-off of chemicals, field waterlogging in Vertisols</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
