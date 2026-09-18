import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "@/components/Icon";

const symptoms = [
  {
    id: "symptom-1",
    icon: "target",
    title: "Concentric Target Spots",
    body: "Dark brown, ringed lesions primarily forming on older, lower foliage.",
  },
  {
    id: "symptom-2",
    icon: "lens_blur",
    title: "Yellow Haloing",
    body: "Chlorosis (yellowing) surrounding the darker necrotic spots, indicating active fungal spread.",
  },
];

export function DiagnosticView() {
  const [state, setState] = useState<"result" | "upload" | "scanning">("result");
  const [hovered, setHovered] = useState<string | null>(null);

  const startScan = () => {
    setState("scanning");
    setTimeout(() => setState("result"), 2000);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center border-b border-muted-foreground/20 bg-background px-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 transition-colors hover:text-primary"
          >
            <Icon name="arrow_back" />
            <span className="font-medium">Back to Dashboard</span>
          </Link>
          <h1 className="ml-auto font-display text-xl font-semibold">Smart Diagnostic</h1>
        </header>

        <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 lg:flex-row lg:overflow-hidden">
          <div className="flex h-full w-full flex-col gap-4 lg:w-1/2">
            {state === "upload" ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  startScan();
                }}
                onClick={startScan}
                className="group flex min-h-[360px] flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 bg-surface/50 p-8 transition-all duration-300 hover:border-primary"
              >
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  <Icon name="add_photo_alternate" filled className="text-4xl" />
                </div>
                <h2 className="mb-2 text-center font-display text-2xl font-semibold">
                  Upload Crop Image
                </h2>
                <p className="mb-8 max-w-md text-center text-foreground/70">
                  Drag and drop a clear, focused photo of the affected leaf, stem, or fruit here for
                  instant AI analysis.
                </p>
                <span className="rounded-full border border-muted-foreground/30 bg-surface px-6 py-3 text-sm font-bold uppercase tracking-[0.05em] text-primary shadow-sm transition-colors group-hover:bg-primary/5">
                  Browse Files
                </span>
              </div>
            ) : (
              <div className="relative min-h-[360px] flex-1 overflow-hidden rounded-2xl bg-foreground shadow-soft">
                <img
                  alt="Tomato leaf with early blight lesions under analysis"
                  className="h-full w-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCn7b9h8BP3Djahb_3WgDxaxtGOrpIpnFwy8MeUPYZtdOS0msZDd93OKuD-7Py0GJgJQJKTs9m3YSj52dFXjC5fpUGDFErwUAjMIDP0PgXDwFCOnFJk1p4AHRsk-LC4hqZ5P1EN3K3K8JBw78-gdqe-J_YKDnrwjquk-29iHBxFTZoL1dgWatJrnFtLG9OcJYEgEVfJq_FPWqfMACzRFuTrS-ySNhuyeSV8GfqTlCvlOGqO0n8pC6iu9A"
                />
                {state === "scanning" && <div className="scan-line" />}

                <div className="pointer-events-none absolute inset-0 z-10 p-4">
                  <BoundingBox
                    style={{ top: "20%", left: "30%", width: "25%", height: "35%" }}
                    visible={state === "result"}
                    onHover={(v) => setHovered(v ? "symptom-1" : null)}
                    label="Anomaly Detected"
                  />
                  <BoundingBox
                    style={{ top: "60%", left: "65%", width: "20%", height: "25%" }}
                    visible={state === "result"}
                    onHover={(v) => setHovered(v ? "symptom-2" : null)}
                  />
                </div>

                <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between">
                  <button className="rounded-full bg-surface/90 p-2 shadow backdrop-blur-sm transition-colors hover:bg-surface">
                    <Icon name="crop_free" />
                  </button>
                  <button
                    onClick={() => setState("upload")}
                    className="flex items-center gap-2 rounded-full bg-surface/90 px-4 py-2 text-sm font-medium shadow backdrop-blur-sm transition-colors hover:bg-surface"
                  >
                    <Icon name="refresh" className="text-lg" /> Scan Another
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex h-full w-full flex-col overflow-y-auto rounded-2xl border border-muted-foreground/10 bg-surface p-6 shadow-soft lg:w-1/2 lg:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-background px-3 py-1.5">
                <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span className="text-sm font-bold text-primary">
                  {state === "scanning" ? "Analyzing…" : "Analysis Complete"}
                </span>
              </div>
              <span className="text-sm text-foreground/50">ID: #Diag-8492</span>
            </div>

            <h2 className="mb-2 font-display text-3xl font-semibold lg:text-4xl">Early Blight</h2>
            <p className="mb-6 italic text-foreground/70">Alternaria solani</p>

            <div className="mb-8 flex flex-wrap gap-3">
              <Badge icon="verified" text="94% Match" className="text-primary" />
              <Badge icon="warning" text="High Spread Risk" className="text-accent" />
              <Badge icon="water_drop" text="Fungal Pathogen" className="text-highlight" muted />
            </div>

            <div className="mb-8 border-t border-muted-foreground/20 pt-6">
              <h3 className="mb-4 font-display text-xl font-semibold">Identified Symptoms</h3>
              <ul className="space-y-3">
                {symptoms.map((s) => (
                  <li
                    key={s.id}
                    onMouseEnter={() => setHovered(s.id)}
                    onMouseLeave={() => setHovered(null)}
                    className={`-mx-3 flex gap-3 rounded-lg p-3 transition-colors ${
                      hovered === s.id ? "bg-accent/10" : ""
                    }`}
                  >
                    <Icon name={s.icon} className="shrink-0 text-accent" />
                    <div>
                      <p className="font-medium">{s.title}</p>
                      <p className="mt-1 text-sm text-foreground/70">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-auto border-t border-muted-foreground/20 pt-6">
              <h3 className="mb-2 font-display text-xl font-semibold">Immediate Recommendation</h3>
              <p className="mb-4 text-foreground/80">
                Isolate affected plants if possible. Avoid overhead watering to reduce leaf wetness,
                which accelerates fungal spore germination.
              </p>
            </div>

            <div className="mt-8 border-t border-muted-foreground/20 pt-6">
              <Link
                to="/care-path"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-bold uppercase tracking-[0.05em] text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
              >
                <Icon name="medical_services" filled />
                Start Guided Care Path
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function BoundingBox({
  style,
  visible,
  onHover,
  label,
}: {
  style: React.CSSProperties;
  visible: boolean;
  onHover: (v: boolean) => void;
  label?: string;
}) {
  return (
    <div
      style={style}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={`pointer-events-auto absolute rounded border-2 border-accent bg-accent/20 transition-all duration-500 hover:border-[3px] hover:bg-accent/40 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {label && (
        <div className="absolute -top-6 left-0 whitespace-nowrap rounded bg-accent px-2 py-1 text-xs font-bold text-accent-foreground shadow-sm">
          {label}
        </div>
      )}
    </div>
  );
}

function Badge({
  icon,
  text,
  className,
  muted,
}: {
  icon: string;
  text: string;
  className: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-muted-foreground/20 bg-background px-3 py-1.5">
      <Icon name={icon} filled className={`text-sm ${className}`} />
      <span className={`text-sm font-bold ${muted ? "text-foreground/80" : className}`}>
        {text}
      </span>
    </div>
  );
}
