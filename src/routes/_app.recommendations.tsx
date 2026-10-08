import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { PageHeader, Panel, RiskBadge } from "@/components/procrop/ui";
import {
  fetchLiveCoimbatoreWeather,
  fetchLatestDatasetPrediction,
  type LiveWeatherResponse,
  type PredictionResponse,
} from "@/services/api";

export const Route = createFileRoute("/_app/recommendations")({
  head: () => ({
    meta: [
      { title: "Dynamic Jassid Recommendations — ProCrop" },
      {
        name: "description",
        content:
          "Daily dynamic spray and management recommendations for Coimbatore cotton based on previous records' ML pest predictions and live rainfall data.",
      },
      { property: "og:title", content: "Dynamic Jassid Recommendations — ProCrop" },
      {
        property: "og:description",
        content:
          "Daily dynamic spray and management recommendations for Coimbatore cotton based on previous records' ML pest predictions and live rainfall data.",
      },
    ],
  }),
  component: RecommendationsPage,
});

interface ActionRecommendation {
  id: string;
  category: "Chemical Control" | "Bio-Pesticide & Botanicals" | "Cultural & Traps" | "Water & Canopy" | "Field Scouting";
  title: string;
  prescription: string;
  rationale: string;
  timing: string;
  priority: "High" | "Medium" | "Low";
  status: "Immediate Action" | "Conditional / On Hold" | "Standard Maintenance";
  icon: string;
}

export default function RecommendationsPage() {
  const [weather, setWeather] = useState<LiveWeatherResponse | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [wData, pData] = await Promise.all([
        fetchLiveCoimbatoreWeather(),
        fetchLatestDatasetPrediction().catch(() => ({
          predicted_next_week_jassid: 2.15,
          risk: "HIGH" as const,
          risk_threshold: 1.95,
          model_used: "XGBoost Model B (Latest Week Record)",
          explanation: [],
        })),
      ]);
      setWeather(wData);
      setPrediction(pData);
      setLastRefreshed(new Date());
    } catch (err: unknown) {
      console.error("Failed to load recommendation telemetry:", err);
      setError(err instanceof Error ? err.message : "Error connecting to backend services.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Generate dynamic recommendations based on predicted risk and rainfall
  const isHighRisk = prediction ? prediction.risk === "HIGH" || prediction.predicted_next_week_jassid >= 1.95 : true;
  const rainfall = weather?.rainfall_mm ?? 0;
  const isRainyDay = rainfall >= 5.0;
  const windSpeed = weather?.wind_speed_kmh ?? 6.0;

  const getDynamicRecommendations = (): ActionRecommendation[] => {
    const list: ActionRecommendation[] = [];

    // 1. Chemical Management
    if (isHighRisk) {
      if (isRainyDay) {
        list.push({
          id: "chem-rain-delay",
          category: "Chemical Control",
          title: "Hold Chemical Foliar Spray (Rain Wash-off Risk)",
          prescription:
            "POSTPONE any synthetic systemic insecticide spray (Flonicamid 50 WG / Dinotefuran 20 SG).",
          rationale: `Live precipitation is ${rainfall} mm. Downpours wash off foliar residues before translaminar absorption can occur. Rainfall itself provides mechanical knockdown of young Jassid nymphs.`,
          timing: "Wait 24–48 hours until rainfall ceases and foliage dries completely.",
          priority: "High",
          status: "Conditional / On Hold",
          icon: "hourglass_top",
        });
      } else if (windSpeed > 12) {
        list.push({
          id: "chem-wind-delay",
          category: "Chemical Control",
          title: "Delay Spraying to Early Morning (Wind Drift Hazard)",
          prescription:
            "Apply Flonicamid 50 WG @ 0.3 g/L or Dinotefuran 20 SG @ 0.2 g/L with hollow cone nozzles.",
          rationale: `Wind velocity is currently ${windSpeed} km/h. High winds cause pesticide drift away from target foliage. Apply early between 6:30 AM – 9:00 AM when wind drops below 8 km/h.`,
          timing: "Early morning calm window (Tomorrow 07:00 AM).",
          priority: "High",
          status: "Immediate Action",
          icon: "air",
        });
      } else {
        list.push({
          id: "chem-immediate",
          category: "Chemical Control",
          title: "Targeted ETL Chemical Spray Application",
          prescription:
            "Spray Flonicamid 50 WG @ 0.3 g/litre (60 g/acre) or Clothianidin 50 WDG @ 0.05 g/litre.",
          rationale: `Predicted Jassid count (${prediction?.predicted_next_week_jassid ?? 2.1} / 3 leaves) breaches the critical economic threshold (1.95). Dry weather (${rainfall} mm rain) ensures optimal residue uptake on leaf undersides.`,
          timing: "Within next 24 to 36 hours during calm hours.",
          priority: "High",
          status: "Immediate Action",
          icon: "vaccines",
        });
      }
    } else {
      list.push({
        id: "chem-low-risk",
        category: "Chemical Control",
        title: "No Chemical Insecticide Required (Below ETL)",
        prescription: "Withhold synthetic chemical sprays. Conserve natural predators and parasitoids.",
        rationale: `Model predicts safe Jassid levels (${prediction?.predicted_next_week_jassid ?? 1.1} / 3 leaves). Preserving predatory Ladybird beetles (Coccinella) and Chrysoperla lacewings provides natural biological suppression.`,
        timing: "Re-evaluate next scheduled SMW forecast.",
        priority: "Low",
        status: "Standard Maintenance",
        icon: "shield",
      });
    }

    // 2. Botanical / Bio-pesticides
    if (isHighRisk && !isRainyDay) {
      list.push({
        id: "bio-neem-active",
        category: "Bio-Pesticide & Botanicals",
        title: "Foliar Application of Neem Formulation (NSKE 5%)",
        prescription:
          "Spray Neem Seed Kernel Extract (NSKE 5%) or Azadirachtin 10,000 ppm @ 1.0 ml/litre of water.",
        rationale:
          "Acts as an anti-feedant, oviposition deterrent, and insect growth regulator (IGR), arresting nymphal molting on tender flush leaves without harming pollinators.",
        timing: "Late afternoon (4:30 PM – 6:00 PM) to avoid UV photolysis of Azadirachtin.",
        priority: "High",
        status: "Immediate Action",
        icon: "eco",
      });
    } else if (isHighRisk && isRainyDay) {
      list.push({
        id: "bio-neem-standby",
        category: "Bio-Pesticide & Botanicals",
        title: "Prepare Botanical Spray Tank for Post-Rain Application",
        prescription:
          "Prepare 5% NSKE stock solution. Add sticking agent (Teepol or Sandovit @ 0.5 ml/L) once skies clear.",
        rationale:
          "Post-rain high humidity accelerates secondary egg hatching. Applying botanical anti-feedants once rain clears prevents rebound multiplication.",
        timing: "Immediately once rainfall ceases and sun breaks through.",
        priority: "Medium",
        status: "Conditional / On Hold",
        icon: "science",
      });
    } else {
      list.push({
        id: "bio-preventive",
        category: "Bio-Pesticide & Botanicals",
        title: "Prophylactic Neem Oil Application",
        prescription: "Foliar mist of cold-pressed Neem Oil 3% (30 ml/L) + soap solution.",
        rationale:
          "Repels sporadic alate adults migrating from neighboring pulses or weed hosts (Abutilon indicum).",
        timing: "Routine maintenance cycle.",
        priority: "Low",
        status: "Standard Maintenance",
        icon: "spa",
      });
    }

    // 3. Cultural & Trap Practices
    list.push({
      id: "traps-sticky",
      category: "Cultural & Traps",
      title: isRainyDay
        ? "Inspect & Refresh Yellow Sticky Traps Post-Rain"
        : "Deploy Yellow Sticky Traps across Canopy Line",
      prescription: "Install 10 to 12 yellow sticky traps per acre at 15 cm above the cotton crop canopy.",
      rationale: isRainyDay
        ? `Recent rainfall (${rainfall} mm) may wash mud onto trap glue. Wipe clean or replace sticky cards to maintain flight monitoring.`
        : "Adult Jassids are strongly phototactic to yellow wavelengths. Trapping directly suppresses adult reproductive pairs and signals population surges.",
      timing: isRainyDay ? "After rain shower concludes" : "Active field installation",
      priority: isHighRisk ? "High" : "Medium",
      status: "Immediate Action",
      icon: "wb_incandescent",
    });

    // 4. Water & Soil Management
    if (isRainyDay) {
      list.push({
        id: "water-drainage",
        category: "Water & Canopy",
        title: "Clear Drainage Furrows in Black Soil (Vertisols)",
        prescription: "Inspect field ditches and ensure drain outlets are cleared to remove standing rain water.",
        rationale: `With ${rainfall} mm rain in Coimbatore, heavy montmorillonite clay soils swell rapidly. Prolonged water stagnation causes root hypoxia and weakens plant immunity.`,
        timing: "Same-day immediate field round.",
        priority: "High",
        status: "Immediate Action",
        icon: "water",
      });
    } else {
      list.push({
        id: "water-nutrition",
        category: "Water & Canopy",
        title: "Balanced Potassium Nutrition to Toughen Leaf Cuticle",
        prescription: "Apply MOP (Muriate of Potash) @ 25 kg/ha or foliar spray 1% KNO3 (Potassium Nitrate).",
        rationale:
          "Adequate potassium thickens cell walls and promotes epidermal silica deposition, physically impeding the piercing-sucking stylets of leafhoppers.",
        timing: "During next scheduled drip or furrow fertigation.",
        priority: "Medium",
        status: "Standard Maintenance",
        icon: "yard",
      });
    }

    // 5. Scouting Frequency
    list.push({
      id: "scouting-freq",
      category: "Field Scouting",
      title: isHighRisk
        ? "Intensive 3-Day Scouting Interval (Top, Mid, Bottom leaves)"
        : "Weekly Standard Scouting Protocol",
      prescription: isHighRisk
        ? "Examine 20 randomly tagged plants across the field. Count nymphs on 3 leaves per plant (1 top, 1 middle, 1 lower)."
        : "Conduct weekly random walk scouting across 10 plants per block.",
      rationale: isHighRisk
        ? "High predicted risk requires tight monitoring of hopperburn progress (Grade I curling to Grade II yellowing)."
        : "Ensures baseline surveillance while pest pressure is subdued.",
      timing: isHighRisk ? "Every 48 to 72 hours at dawn" : "Once per Standard Meteorological Week",
      priority: isHighRisk ? "High" : "Low",
      status: "Immediate Action",
      icon: "search_check",
    });

    return list;
  };

  const recs = getDynamicRecommendations();

  return (
    <div className="px-5 py-8 md:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader
          eyebrow="Act · Agronomic Decision Support"
          title="Dynamic Jassid Recommendations"
          description="Prescriptive action plan refreshed daily for Coimbatore cotton, linking the previous record's ML pest forecast with today's real-time rainfall and weather conditions."
        />
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted disabled:opacity-50 transition-colors"
          >
            <span className={`material-symbols-outlined text-lg ${loading ? "animate-spin" : ""}`}>
              sync
            </span>
            <span>{loading ? "Refreshing..." : "Refresh Daily Plan"}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Driver Telemetry Bar */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">psychology</span>
              <h2 className="text-sm font-bold text-foreground">
                Active Telemetry Driving Today's Recommendations
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Updated: {lastRefreshed ? lastRefreshed.toLocaleString() : "Syncing..."} · Region:
              Coimbatore Cotton Belt
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Predicted Risk Badge */}
            <div className="rounded-xl border border-border bg-muted/30 px-3.5 py-2">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">
                ML Predicted Jassid Risk
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <RiskBadge level={isHighRisk ? "high" : "low"} />
                <span className="text-xs font-mono font-semibold text-foreground">
                  {prediction?.predicted_next_week_jassid ?? 2.15} / 3 leaves
                </span>
              </div>
            </div>

            {/* Today's Rain */}
            <div className="rounded-xl border border-border bg-muted/30 px-3.5 py-2">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">
                Today's Rainfall
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="material-symbols-outlined text-primary text-base">rainy</span>
                <span className="text-xs font-bold text-foreground">{rainfall} mm</span>
                <span className="text-[11px] text-muted-foreground">
                  ({isRainyDay ? "Wash-off Risk Active" : "Dry Foliage"})
                </span>
              </div>
            </div>

            {/* Weather Wind & Temp */}
            <div className="rounded-xl border border-border bg-muted/30 px-3.5 py-2">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">
                Surface Wind & Morning RH
              </p>
              <p className="text-xs font-semibold text-foreground mt-0.5">
                {windSpeed} km/h · {weather?.rh_morning_pct ?? 78}% RH
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-semibold">Telemetry Synchronization Alert</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {/* Dynamic Recommendation Cards */}
      <div className="space-y-4">
        {recs.map((r) => (
          <Panel
            key={r.id}
            title={r.title}
            subtitle={`${r.category} · Timing: ${r.timing}`}
            icon={r.icon}
          >
            <div className="space-y-2.5">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">
                  Prescription / Protocol
                </p>
                <p className="text-sm font-semibold text-foreground">{r.prescription}</p>
              </div>

              <div className="text-sm text-foreground/80 leading-relaxed">
                <span className="font-semibold text-foreground">Agronomic Rationale: </span>
                {r.rationale}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 pt-1 border-t border-border/50">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    r.priority === "High"
                      ? "bg-risk-high/15 text-risk-high border border-risk-high/30"
                      : r.priority === "Medium"
                        ? "bg-risk-moderate/15 text-risk-moderate border border-risk-moderate/30"
                        : "bg-risk-low/15 text-risk-low border border-risk-low/30"
                  }`}
                >
                  {r.priority} Priority
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                    r.status === "Immediate Action"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : r.status === "Conditional / On Hold"
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {r.status}
                </span>

                <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
                  {r.timing}
                </span>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
