import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "@/components/Icon";

const layers = [
  { id: "rgb", icon: "satellite", title: "RGB Visual" },
  { id: "ndvi", icon: "eco", title: "NDVI (Vegetation Index)" },
  { id: "thermal", icon: "thermostat", title: "Thermal Imaging" },
  { id: "moisture", icon: "water_drop", title: "Soil Moisture" },
] as const;

const rows = [
  {
    zone: "Zone 4-A",
    quad: "North Quadrant",
    variance: "-0.15",
    trend: "trending_down",
    trendClass: "text-critical",
    moisture: 18,
    barClass: "bg-critical",
    npk: "12-4-8",
    status: "Action Required",
    statusClass: "bg-critical/10 text-critical border-critical/30",
    dot: "bg-critical",
    rowClass: "bg-critical/5",
  },
  {
    zone: "Zone 4-B",
    quad: "East Quadrant",
    variance: "-0.02",
    trend: "trending_flat",
    trendClass: "text-muted-foreground",
    moisture: 32,
    barClass: "bg-accent",
    npk: "14-6-10",
    status: "Monitor",
    statusClass: "bg-accent/10 text-accent border-accent/30",
    dot: "bg-accent",
    rowClass: "",
  },
  {
    zone: "Zone 4-C",
    quad: "South Quadrant",
    variance: "+0.04",
    trend: "trending_up",
    trendClass: "text-vitality",
    moisture: 45,
    barClass: "bg-vitality",
    npk: "15-5-10",
    status: "Optimal",
    statusClass: "bg-vitality/10 text-primary border-vitality/30",
    dot: "bg-vitality",
    rowClass: "",
  },
  {
    zone: "Zone 4-D",
    quad: "West Quadrant",
    variance: "+0.01",
    trend: "trending_up",
    trendClass: "text-vitality",
    moisture: 42,
    barClass: "bg-vitality",
    npk: "15-5-10",
    status: "Optimal",
    statusClass: "bg-vitality/10 text-primary border-vitality/30",
    dot: "bg-vitality",
    rowClass: "",
  },
];

export function AnalysisView() {
  const [layer, setLayer] = useState<string>("ndvi");
  const [pass, setPass] = useState(75);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden bg-background">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border bg-surface px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="rounded-full p-2 transition-colors hover:bg-muted"
            aria-label="Back"
          >
            <Icon name="arrow_back" className="text-muted-foreground" />
          </Link>
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              <span>Farm Overview</span>
              <Icon name="chevron_right" className="text-[14px]" />
              <span className="text-primary">Zone 4 Deep Dive</span>
            </div>
            <h1 className="font-display text-2xl font-semibold">Detailed Health Analysis</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded border border-critical/20 bg-critical/10 px-3 py-1.5">
            <Icon name="warning" filled className="text-sm text-critical" />
            <span className="text-sm font-medium text-critical">High Risk: Moisture Stress</span>
          </div>
          <Link
            to="/diagnostic"
            className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <span>Analyze Risk</span>
            <Icon name="science" className="text-sm" />
          </Link>
        </div>
      </header>

      <main className="relative flex flex-1 flex-col overflow-hidden">
        <div className="relative h-[60%] w-full shrink-0 border-b border-border bg-muted">
          <div
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-300"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAGsJNSvNgcu6Yu38OMr2ZcYp13Pdff_VXJG_nijoU4j23cL7BS3NELC9TJ0Bn9RZjbgyXZa5BgpDeZPrhlKqWBMGIHGNdSYOVaU4VerAruP6EnPkSOTHBDG2irZ3GWuUf1qszPGt3dIdGpDd1LZbsM9fyogR7wcp71TJ-HXEPf_WGN3JLXSiaIumphgPf-KPzMu-DIV6uvihQcZArwpLS8kYNABOY2kJTnEhYOB3bcaRfTtcDu6cZ9KA')",
              opacity: layer === "ndvi" ? 1 : 0.65,
              filter:
                layer === "thermal"
                  ? "hue-rotate(-60deg) saturate(1.4)"
                  : layer === "moisture"
                    ? "hue-rotate(120deg)"
                    : layer === "rgb"
                      ? "grayscale(0.3) saturate(0.7)"
                      : "none",
            }}
          />

          <div className="absolute left-6 top-6 z-10 flex flex-col overflow-hidden rounded border border-border bg-surface shadow-sm">
            {layers.map((l) => (
              <button
                key={l.id}
                title={l.title}
                onClick={() => setLayer(l.id)}
                className={`flex h-12 w-12 items-center justify-center border-b border-border transition-colors last:border-b-0 ${
                  layer === l.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon name={l.icon} />
              </button>
            ))}
          </div>

          <div className="absolute bottom-24 right-6 z-10 flex flex-col gap-2">
            <div className="flex flex-col rounded border border-border bg-surface shadow-sm">
              <button className="flex h-8 w-8 items-center justify-center border-b border-border hover:bg-muted">
                <Icon name="add" className="text-sm" />
              </button>
              <button className="flex h-8 w-8 items-center justify-center hover:bg-muted">
                <Icon name="remove" className="text-sm" />
              </button>
            </div>
            <button className="flex h-8 w-8 items-center justify-center rounded border border-border bg-surface shadow-sm hover:bg-muted">
              <Icon name="explore" className="-rotate-45 text-sm" />
            </button>
          </div>

          <div className="absolute bottom-0 left-0 z-10 flex w-full items-center gap-6 border-t border-border bg-surface/90 px-8 py-4 backdrop-blur-sm">
            <button className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted">
              <Icon name="play_arrow" filled />
            </button>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex justify-between px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <span>May 01</span>
                <span>May 08</span>
                <span>May 15</span>
                <span className="text-primary">May 22 (Current)</span>
                <span>May 29</span>
              </div>
              <div className="relative flex w-full items-center">
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={pass}
                  onChange={(e) => setPass(Number(e.target.value))}
                  aria-label="Satellite pass timeline"
                  className="timeline w-full appearance-none bg-transparent focus:outline-none"
                />
                <div
                  className="pointer-events-none absolute left-0 h-1 rounded-l-sm bg-primary"
                  style={{ width: `${pass}%` }}
                />
              </div>
            </div>
            <div className="min-w-[100px] text-right">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Pass Date
              </div>
              <div className="font-display text-sm font-semibold">May 22, 14:30</div>
            </div>
          </div>
        </div>

        <div className="flex h-[40%] w-full shrink-0 flex-col bg-surface">
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-surface shadow-[0_1px_0_0_var(--border)]">
                <tr>
                  {["Sub-Zone", "NDVI Variance", "Moisture %", "NPK Ratio", "Status"].map((h) => (
                    <th
                      key={h}
                      className="w-1/5 border-b border-border px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr
                    key={r.zone}
                    className={`cursor-pointer transition-colors hover:bg-muted/60 ${r.rowClass}`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-display font-semibold">{r.zone}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{r.quad}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${r.trendClass}`}>{r.variance}</span>
                        <Icon name={r.trend} className={`text-sm ${r.trendClass}`} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{r.moisture}%</span>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full ${r.barClass}`}
                            style={{ width: `${r.moisture}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{r.npk}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs font-medium ${r.statusClass}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${r.dot}`} />
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
