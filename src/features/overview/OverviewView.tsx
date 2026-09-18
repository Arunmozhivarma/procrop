import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "@/components/Icon";

const zones = [
  {
    id: "zone1",
    label: "Sector 1: Corn",
    score: 92,
    note: "Excellent",
    x: "30%",
    y: "22%",
    r: 80,
    tone: "good",
  },
  {
    id: "zone2",
    label: "Sector 4: Tomatoes",
    score: 65,
    note: "Warning",
    x: "65%",
    y: "45%",
    r: 60,
    tone: "warn",
  },
  {
    id: "zone3",
    label: "Sector 2: Wheat",
    score: 88,
    note: "Good",
    x: "25%",
    y: "72%",
    r: 100,
    tone: "good",
  },
] as const;

export function OverviewView() {
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <div className="relative flex overflow-hidden bg-background">
      <div className="bg-texture" />
      <div className="relative z-10 flex min-h-[calc(100vh-4rem)] w-full">
        <main className="relative flex flex-1 flex-col overflow-hidden bg-[oklch(0.915_0.014_84)]">
          <div className="absolute right-6 top-6 z-30 hidden sm:block lg:right-[344px]">
            <div className="flex items-center gap-4 rounded-full border border-surface bg-surface/90 p-2 shadow-soft backdrop-blur-md">
              <Metric icon="thermostat" value="72°F" tone="highlight" />
              <div className="h-6 w-px bg-muted-foreground/30" />
              <Metric icon="water_drop" value="45%" tone="highlight" />
              <div className="h-6 w-px bg-muted-foreground/30" />
              <Metric icon="grass" value="60%" tone="primary" />
            </div>
          </div>

          <div className="z-20 flex items-center justify-between bg-surface p-4 shadow-sm md:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Icon name="eco" filled className="text-sm" />
              </div>
              <h1 className="font-display text-lg font-semibold">Overview</h1>
            </div>
            <button
              onClick={() => setPanelOpen(true)}
              className="p-2"
              aria-label="Open sector details"
            >
              <Icon name="menu" />
            </button>
          </div>

          <div className="relative h-full w-full flex-1 overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-multiply"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAh-05ecNkJmAM5xIaK4JA1hYMZJPjuvFIWrDQmBhvZQrS-758y0GLVxzkITbWPTt3YtonTWDR34NzDnPUvyhQwWIxRpvG8PzYwYoD9MSQ06kT7uufcX4yQNDLYqv22cDt2tC1HCcRPD1qWWL7jOW0M6R9rsCouGuVyPGi0I4LWhQVhH0WHo_24mSgkKnv1dAAFoNF3JCFgaHDP_qVG9QL4_5NXSwat5F89p1354NHqPgavW60tm-unWg')",
              }}
            />

            {/* Interactive vitality rings */}
            {zones.map((z) => (
              <button
                key={z.id}
                onClick={() => setPanelOpen(true)}
                title={`${z.label} — Score ${z.score}`}
                className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ left: z.x, top: z.y, width: z.r * 2, height: z.r * 2 }}
              >
                <span
                  className={`absolute inset-0 animate-[pulse_3s_cubic-bezier(0.4,0,0.6,1)_infinite] rounded-full border-8 transition-all group-hover:border-[12px] ${
                    z.tone === "good"
                      ? "border-vitality bg-vitality/15"
                      : "border-accent bg-accent/15"
                  }`}
                />
                {z.tone === "warn" && (
                  <span className="absolute left-1/2 top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md">
                    <Icon name="priority_high" className="text-[14px]" />
                  </span>
                )}
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 flex-col items-center rounded-xl border border-muted-foreground/20 bg-surface p-2 opacity-0 shadow-soft transition-opacity group-hover:opacity-100">
                  <span className="whitespace-nowrap text-sm font-bold">{z.label}</span>
                  <span
                    className={`text-xs font-medium ${z.tone === "good" ? "text-vitality" : "text-accent"}`}
                  >
                    Score: {z.score} ({z.note})
                  </span>
                </span>
              </button>
            ))}

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex h-48 w-48 animate-[breathe_4s_ease-in-out_infinite] flex-col items-center justify-center rounded-full border-4 border-surface bg-surface/80 shadow-[0_0_60px_rgba(110,155,86,0.35)] backdrop-blur-sm">
                <span className="mb-1 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                  Eco-Pulse
                </span>
                <span className="font-display text-5xl font-semibold text-vitality">85</span>
                <span className="mt-2 rounded-full bg-vitality/10 px-3 py-1 text-xs">
                  Vitality Good
                </span>
              </div>
            </div>

            <div className="absolute bottom-6 left-6 z-20 flex flex-col">
              <button className="flex h-10 w-10 items-center justify-center rounded-t-xl bg-surface shadow-soft transition hover:bg-muted-foreground/10">
                <Icon name="add" />
              </button>
              <button className="flex h-10 w-10 items-center justify-center rounded-b-xl bg-surface shadow-soft transition hover:bg-muted-foreground/10">
                <Icon name="remove" />
              </button>
            </div>
          </div>
        </main>

        {/* Detail panel */}
        <aside
          className={`absolute right-0 z-40 h-full w-full overflow-y-auto border-l border-muted-foreground/20 bg-surface shadow-[-10px_0_40px_rgba(0,0,0,0.05)] transition-transform duration-300 lg:relative lg:w-[320px] lg:translate-x-0 ${
            panelOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-muted-foreground/10 bg-surface/95 p-6 pb-4 backdrop-blur">
            <div>
              <h2 className="font-display text-xl font-semibold">Sector Details</h2>
              <p className="text-sm text-muted-foreground">Currently monitoring 1 zone</p>
            </div>
            <button
              onClick={() => setPanelOpen(false)}
              className="rounded-full p-2 hover:bg-muted-foreground/10 lg:hidden"
              aria-label="Close panel"
            >
              <Icon name="close" />
            </button>
          </div>

          <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col overflow-hidden rounded-lg border border-muted-foreground/20 bg-background shadow-sm">
              <div className="relative h-40 w-full">
                <img
                  className="h-full w-full object-cover"
                  alt="Macro shot of tomato foliage with early blight spots"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6Vspnzc_rUZbdqN7k0QkjdywAk55268WZDxssI_NvYL3tLmcOT6KeVupHg3TNY6pIOx5QYab41hDADLiYXDPSpj59355ftRTa0SJBhxSHXfMylAJwkwhU3hGRJPgGCGcFMo4fm5n65sarz5ytM0zxHLsu7yt97VIFTorSnNoBKN5q9kKZ9phY9XW87GUE8EEvPEVjdSasrM3HhT3d08jPeSUZoe1RM87jDSiaJfjjpJILm1Qpvhqr1Q"
                />
                <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-surface/90 px-3 py-1 shadow-sm backdrop-blur-sm">
                  <div className="h-2 w-2 rounded-full bg-accent" />
                  <span className="text-xs font-bold">Score: 65</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 p-5">
                <div>
                  <h3 className="font-display text-lg font-semibold">Sector 4: Tomatoes</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Planted: Mar 12 • 4 Acres</p>
                </div>

                <div className="flex items-start gap-3 rounded-md border border-accent/20 bg-accent/10 p-3">
                  <Icon name="warning" filled className="mt-0.5 text-accent" />
                  <div>
                    <p className="text-sm font-semibold text-accent">Vitality Warning</p>
                    <p className="mt-1 text-xs text-foreground/80">
                      Anomaly detected in foliage patterns. Possible fungal onset.
                    </p>
                  </div>
                </div>

                <Link
                  to="/diagnostic"
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-[15px] font-bold uppercase tracking-[0.05em] text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
                >
                  <Icon name="document_scanner" className="text-[18px]" />
                  Run Smart Diagnostic
                </Link>
              </div>
            </div>

            <div className="mt-2 flex flex-col gap-3">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Local Metrics
              </h4>
              <div className="flex gap-3">
                <MetricCard
                  icon="water_drop"
                  iconClass="text-highlight"
                  label="Moisture"
                  value="32%"
                  foot="-5% from optimal"
                  footClass="text-accent"
                />
                <MetricCard
                  icon="science"
                  iconClass="text-primary"
                  label="pH Level"
                  value="6.2"
                  foot="Optimal range"
                  footClass="text-vitality"
                />
              </div>
              <Link
                to="/analysis"
                className="flex items-center justify-center gap-2 rounded-full border border-muted-foreground/20 bg-background py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
              >
                <Icon name="analytics" className="text-[18px]" />
                Open Deep Dive Analysis
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Metric({
  icon,
  value,
  tone,
}: {
  icon: string;
  value: string;
  tone: "highlight" | "primary";
}) {
  return (
    <div className="flex items-center gap-2 px-3">
      <Icon
        name={icon}
        filled
        className={tone === "highlight" ? "text-highlight" : "text-primary"}
      />
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}

function MetricCard({
  icon,
  iconClass,
  label,
  value,
  foot,
  footClass,
}: {
  icon: string;
  iconClass: string;
  label: string;
  value: string;
  foot: string;
  footClass: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1 rounded-lg border border-muted-foreground/20 bg-background p-4">
      <Icon name={icon} className={`mb-1 text-[20px] ${iconClass}`} />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-lg font-bold">{value}</span>
      <span className={`mt-1 text-[10px] font-medium ${footClass}`}>{foot}</span>
    </div>
  );
}
