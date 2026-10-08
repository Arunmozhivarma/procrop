import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel } from "@/components/procrop/ui";

export const Route = createFileRoute("/_app/soil")({
  head: () => ({
    meta: [
      { title: "Coimbatore Cotton Soils & Agronomic Benefits — ProCrop" },
      {
        name: "description",
        content:
          "Agronomic guide to the major soil types supporting cotton cultivation in Coimbatore, Tamil Nadu and their benefits for crop health and pest tolerance.",
      },
      { property: "og:title", content: "Coimbatore Cotton Soils & Agronomic Benefits — ProCrop" },
      {
        property: "og:description",
        content:
          "Agronomic guide to the major soil types supporting cotton cultivation in Coimbatore, Tamil Nadu and their benefits for crop health and pest tolerance.",
      },
    ],
  }),
  component: SoilPage,
});

interface SoilType {
  id: string;
  name: string;
  localName: string;
  order: string;
  locations: string;
  texture: string;
  phRange: string;
  waterHolding: string;
  cec: string;
  keyBenefits: string[];
  pestImpact: string;
  recommendedPractices: string[];
  cottonSuitability: "Optimal" | "Highly Favorable" | "Good with Drainage";
  colorClass: string;
}

const coimbatoreSoils: SoilType[] = [
  {
    id: "vertisol",
    name: "Deep Black Cotton Soil",
    localName: "Karisal Mann (கரிசல் மண்)",
    order: "Vertisols / Chromic Pellusterts",
    locations: "Palladam, Sulur, Pollachi North, Annur & eastern Coimbatore tracts",
    texture: "Heavy montmorillonitic clay (45%–62% clay fraction)",
    phRange: "7.8 – 8.6 (Mildly to Moderately Alkaline)",
    waterHolding: "Exceptional (200–250 mm/m available moisture)",
    cec: "Very High (40–60 cmol(+)/kg), rich in Ca, Mg & Carbonates",
    keyBenefits: [
      "High capillary water retention maintains moisture across extended rainfed dry spells during Coimbatore's Kharif & Rabi transitions.",
      "High cation exchange capacity (CEC) provides abundant reservoir of calcium and magnesium vital for boll development.",
      "Unique self-mulching / self-ploughing property: deep shrinkage cracks facilitate subsoil aeration and rapid rain infiltration during initial monsoon storms.",
      "Exceptional nutrient buffer capacity prevents fast leaching of basal nitrogen and potassium fertilizers.",
    ],
    pestImpact:
      "High water retention produces lush, succulent leaves. Excessive vegetative vigor without balanced potassium can thin cuticle layers and attract Jassids. Strict K2O top-dressing reinforces epidermal silica deposition to deter leafhopper stylets.",
    recommendedPractices: [
      "Maintain a 100:50:50 NPK ratio; avoid excessive early nitrogen application that causes lush canopy succulent to Jassids.",
      "Deep summer ploughing to expose pupating pests and weed rhizomes.",
      "Adopt broad bed and furrow (BBF) or ridges to avoid temporary root waterlogging during sudden heavy downpours.",
    ],
    cottonSuitability: "Optimal",
    colorClass: "border-emerald-600/30 bg-emerald-950/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "alfisol",
    name: "Red Sandy Loam to Red Loam",
    localName: "Semman (செம்மண்)",
    order: "Alfisols / Rhodustalfs",
    locations: "Thondamuthur, Kinathukadavu, Madukkarai & Western Ghats foothills",
    texture: "Sandy clay loam to gravelly sandy loam",
    phRange: "6.2 – 7.2 (Slightly Acidic to Neutral)",
    waterHolding: "Moderate (100–140 mm/m available moisture)",
    cec: "Moderate (15–25 cmol(+)/kg), Kaolinitic & illitic clays",
    keyBenefits: [
      "Superior macroporosity and unhindered internal drainage prevent root asphyxiation, collar rot, and Fusarium wilt during Northeast Monsoon rain spikes.",
      "Earlier soil warming in mornings promotes rapid germination, vigorous taproot elongation, and fast seedling establishment.",
      "Highly responsive to micro-irrigation and fertigation, allowing precise delivery of water and soluble fertilizers.",
      "Friable, easy-tilth structure minimizes soil compaction and facilitates effortless mechanical hoeing and weeding.",
    ],
    pestImpact:
      "Cotton plants mature more uniformly without unmanageable vegetative surge. Moisture stress during dry spells can cause premature leaf curling, which must be distinguished from Jassid hopperburn. Drip irrigation keeps cell turgor steady.",
    recommendedPractices: [
      "Incorporate 12.5 t/ha Farm Yard Manure (FYM) or coir pith compost to boost organic matter and moisture holding capacity.",
      "Split nitrogen and potassium into 3–4 fertigation doses to avert leaching losses.",
      "Foliar spray of 1% DAP + 0.5% MOP at 60 and 75 DAS to maintain leaf toughness against sucking pests.",
    ],
    cottonSuitability: "Highly Favorable",
    colorClass: "border-amber-600/30 bg-amber-950/10 text-amber-600 dark:text-amber-400",
  },
  {
    id: "alluvial",
    name: "Riparian Clay Loam / Valley Alluvium",
    localName: "Vandal Mann (வண்டல் மண்)",
    order: "Inceptisols / Fluventic Haplustepts",
    locations: "Noyyal River basin, Singanallur plain, Alandurai & Bhavani periphery",
    texture: "Fine loamy to silty clay loam",
    phRange: "7.0 – 7.8 (Near Neutral)",
    waterHolding: "High (160–200 mm/m available moisture)",
    cec: "High (28–38 cmol(+)/kg), balanced mineralogy",
    keyBenefits: [
      "Optimal balance of aeration and moisture holding capacity ensures uninterrupted nutrient transpiration and boll filling.",
      "Naturally enriched with silt and organic sediment from historical river basin deposits, providing strong natural biological activity.",
      "Deep effective root zone (> 100 cm) permits taproot to access subsoil moisture reserves with ease.",
      "Low mechanical resistance allows lateral secondary root expansion, supporting sturdy anchorage for high-yielding Bt hybrid canopies.",
    ],
    pestImpact:
      "Moderate canopy density with balanced internode length. Jassid populations can build up rapidly in humid riverside pockets when morning relative humidity exceeds 80%. Timely canopy thinning and yellow sticky traps are highly effective here.",
    recommendedPractices: [
      "Adopt paired row planting (60/90 x 45 cm) or wider row spacing (120 x 60 cm for Bt hybrids) to maximize airflow and sunlight penetration.",
      "Apply bio-fertilizers (Azospirillum and Phosphobacteria @ 2 kg/ha each) to activate native soil phosphorus.",
      "Monitor morning dew duration; damp valley humidity accelerates nymph hatching.",
    ],
    cottonSuitability: "Optimal",
    colorClass: "border-sky-600/30 bg-sky-950/10 text-sky-600 dark:text-sky-400",
  },
];

export default function SoilPage() {
  const [selectedSoil, setSelectedSoil] = useState<string>("vertisol");
  const current: SoilType = coimbatoreSoils.find((s) => s.id === selectedSoil) ?? coimbatoreSoils[0]!;

  return (
    <div className="px-5 py-8 md:px-8">
      <PageHeader
        eyebrow="Sense · Pedology & Soil Science"
        title="Coimbatore Cotton Soils & Agronomic Benefits"
        description="Soil characteristics, regional distribution, and crop benefits for cotton cultivation across Coimbatore district — explaining their direct role in plant vigor and Jassid tolerance."
      />

      {/* Overview Card */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">landslide</span>
              <h2 className="text-lg font-bold text-foreground">
                The Pedological Landscape of Coimbatore Cotton
              </h2>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Coimbatore district lies in the rain-shadow of the Western Ghats (Palakkad Gap),
              characterized by semi-arid tropical conditions. Cotton cultivation here relies heavily on two
              predominant soil orders: <strong>Vertisols (Black Cotton Soils)</strong> and{" "}
              <strong>Alfisols (Red Loams)</strong>, supplemented by fertile riparian alluvium along the
              Noyyal basin. Soil texture, drainage, and potassium availability dictate canopy thickness,
              cuticle resilience, and vulnerability to Jassid (<em>Amrasca biguttula biguttula</em>) sap-feeding.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 md:flex-col">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/60 px-3 py-1.5 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Vertisols (Karibal): ~58%
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/60 px-3 py-1.5 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span> Alfisols (Semman): ~34%
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/60 px-3 py-1.5 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-sky-500"></span> Alluvial Loams: ~8%
            </span>
          </div>
        </div>
      </div>

      {/* Soil Selector Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {coimbatoreSoils.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedSoil(s.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              selectedSoil === s.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            <span className="material-symbols-outlined text-lg">terrain</span>
            <span>{s.name}</span>
            <span className="text-xs opacity-80">({s.localName.split(" ")[0]})</span>
          </button>
        ))}
      </div>

      {/* Selected Soil Profile Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Properties & Distribution */}
        <div className="space-y-6 lg:col-span-1">
          <Panel title="Soil Profile & Classification" icon="science">
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Soil Taxonomy Order
                </p>
                <p className="font-medium text-foreground">{current.order}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Local Tamil Classification
                </p>
                <p className="font-medium text-primary font-mono">{current.localName}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Key Coimbatore Pockets
                </p>
                <p className="text-foreground">{current.locations}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Suitability for Hybrid Bt Cotton
                </p>
                <span className={`inline-block mt-1 rounded-md px-2.5 py-1 text-xs font-bold border ${current.colorClass}`}>
                  {current.cottonSuitability}
                </span>
              </div>
            </div>
          </Panel>

          <Panel title="Physicochemical Metrics" icon="bar_chart">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Texture:</span>
                <span className="font-medium text-right text-foreground">{current.texture}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">pH Range:</span>
                <span className="font-semibold text-foreground">{current.phRange}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Water Capacity:</span>
                <span className="font-medium text-right text-foreground">{current.waterHolding}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-muted-foreground">Cation Exchange (CEC):</span>
                <span className="font-medium text-right text-foreground">{current.cec}</span>
              </div>
            </div>
          </Panel>
        </div>

        {/* Right Column: Agronomic Benefits, Pest Dynamics, Management */}
        <div className="space-y-6 lg:col-span-2">
          {/* Agronomic Benefits */}
          <Panel title={`Agronomic Benefits for Cotton Cultivation`} icon="verified">
            <div className="space-y-3">
              {current.keyBenefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3.5">
                  <span className="material-symbols-outlined mt-0.5 text-emerald-500 text-lg shrink-0">
                    check_circle
                  </span>
                  <p className="text-sm leading-relaxed text-foreground/90">{benefit}</p>
                </div>
              ))}
            </div>
          </Panel>

          {/* Jassid Pest Interaction */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
            <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400 font-bold">
              <span className="material-symbols-outlined text-xl">pest_control</span>
              <h3>Influence on Cotton Jassid Susceptibility</h3>
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">{current.pestImpact}</p>
          </div>

          {/* Recommended Field Management Practices */}
          <Panel title="Agronomic & Soil Management Recommendations" icon="agriculture">
            <ul className="space-y-2.5 text-sm text-foreground/80">
              {current.recommendedPractices.map((practice, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined mt-0.5 text-primary text-base shrink-0">
                    arrow_right_alt
                  </span>
                  <span>{practice}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      {/* Comparative Summary Matrix */}
      <div className="mt-8">
        <Panel title="Comparative Soil Matrix for Coimbatore Cotton Belt" icon="table_chart">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-4">Soil Type</th>
                  <th className="py-3 px-4">Primary Belts</th>
                  <th className="py-3 px-4">Moisture Retention</th>
                  <th className="py-3 px-4">Drainage Quality</th>
                  <th className="py-3 px-4">Jassid Canopy Risk</th>
                  <th className="py-3 px-4">Key Nutrient Need</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-semibold text-foreground">Deep Black (Vertisol)</td>
                  <td className="py-3 px-4 text-muted-foreground">Palladam, Pollachi, Annur</td>
                  <td className="py-3 px-4 text-emerald-600 font-medium">Very High (220 mm/m)</td>
                  <td className="py-3 px-4 text-muted-foreground">Slow (crack aeration)</td>
                  <td className="py-3 px-4 text-amber-600 font-semibold">High if excess N applied</td>
                  <td className="py-3 px-4 text-muted-foreground">Potassium (K2O) top-dress</td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-semibold text-foreground">Red Loam (Alfisol)</td>
                  <td className="py-3 px-4 text-muted-foreground">Thondamuthur, Kinathukadavu</td>
                  <td className="py-3 px-4 text-amber-600 font-medium">Moderate (120 mm/m)</td>
                  <td className="py-3 px-4 text-emerald-600 font-medium">Rapid / Excellent</td>
                  <td className="py-3 px-4 text-emerald-600 font-semibold">Moderate / Low</td>
                  <td className="py-3 px-4 text-muted-foreground">FYM + split N & K</td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-semibold text-foreground">Alluvial Clay Loam</td>
                  <td className="py-3 px-4 text-muted-foreground">Noyyal Valley, Sulur</td>
                  <td className="py-3 px-4 text-emerald-600 font-medium">High (180 mm/m)</td>
                  <td className="py-3 px-4 text-muted-foreground">Moderate / Well drained</td>
                  <td className="py-3 px-4 text-amber-600 font-semibold">High during humid fog</td>
                  <td className="py-3 px-4 text-muted-foreground">Bio-P + canopy airflow</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
