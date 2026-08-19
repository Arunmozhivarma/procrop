import { createFileRoute, Link } from "@tanstack/react-router";
import { Icon } from "@/components/Icon";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ProCrop — AI Crop Health, Soil & Pest Risk Intelligence" },
      {
        name: "description",
        content:
          "ProCrop fuses soil sensors, weather, crop history and leaf imagery into explainable AI risk predictions and field-ready recommendations for farmers.",
      },
      { property: "og:title", content: "ProCrop — AI Crop Health, Soil & Pest Risk Intelligence" },
      {
        property: "og:description",
        content:
          "ProCrop fuses soil sensors, weather, crop history and leaf imagery into explainable AI risk predictions and field-ready recommendations for farmers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const workflow = [
  { icon: "sensors", title: "Collect", body: "Soil probes, weather feeds, crop records and farmer notes." },
  { icon: "monitoring", title: "Monitor", body: "Continuous soil, nutrient and environment tracking per field." },
  { icon: "readiness_score", title: "Predict risk", body: "Random Forest and XGBoost score disease and pest pressure." },
  { icon: "add_a_photo", title: "Request image", body: "High-risk fields trigger a targeted leaf photo request." },
  { icon: "document_scanner", title: "Analyze", body: "A CNN identifies the disease and grades its severity." },
  { icon: "psychology", title: "Explain", body: "SHAP and Grad-CAM show exactly why the model decided." },
  { icon: "checklist", title: "Recommend", body: "Irrigation, nutrient and spray actions with timing." },
  { icon: "notifications", title: "Alert", body: "Severity-ranked alerts reach the right person fast." },
  { icon: "insights", title: "Track", body: "Season analytics prove what worked and what did not." },
];

const features = [
  {
    icon: "hub",
    title: "Multimodal AI",
    body: "Structured agronomy data and leaf imagery are fused into one assessment instead of two disconnected tools.",
  },
  {
    icon: "landslide",
    title: "Soil monitoring",
    body: "Moisture, pH, N-P-K and soil temperature with healthy bands, deficiency warnings and trend history.",
  },
  {
    icon: "pest_control",
    title: "Pest & disease risk",
    body: "Risk-driven forecasting flags pressure days before symptoms appear on the canopy.",
  },
  {
    icon: "document_scanner",
    title: "AI image analysis",
    body: "Leaf photos are graded for disease, confidence and affected area with heatmap overlays.",
  },
  {
    icon: "psychology",
    title: "Explainable AI",
    body: "Every prediction lists its driving factors in plain language, not just a score.",
  },
  {
    icon: "checklist",
    title: "Smart recommendations",
    body: "Actions ranked by priority, with effort, window and expected impact.",
  },
  {
    icon: "settings_input_antenna",
    title: "IoT integration",
    body: "ESP32 and ESP8266 nodes stream readings; simulated data keeps the platform usable without hardware.",
  },
  {
    icon: "monitoring",
    title: "Analytics",
    body: "Season trends, risk history and model performance metrics in one report view.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Icon name="eco" filled />
            </span>
            <span className="font-display text-xl font-semibold">ProCrop</span>
          </Link>
          <nav className="ml-auto hidden items-center gap-6 text-sm font-medium text-foreground/70 md:flex">
            <a href="#how" className="hover:text-primary">How it works</a>
            <a href="#features" className="hover:text-primary">Platform</a>
            <Link to="/about" className="hover:text-primary">About</Link>
            <Link to="/help" className="hover:text-primary">Help</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <Link
              to="/auth"
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              Sign in
            </Link>
            <Link
              to="/dashboard"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Open dashboard
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border">
        <div className="bg-texture" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <Icon name="auto_awesome" className="text-[16px]" />
              Multimodal agricultural intelligence
            </span>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Monitor, predict, explain and recommend — before symptoms show.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-foreground/70">
              ProCrop combines soil parameters, environmental conditions, crop history and leaf
              imagery into one risk-driven workflow, so every alert arrives with a reason and a
              next action.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Explore the platform
                <Icon name="arrow_forward" className="text-[18px]" />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-6 py-3 font-semibold hover:bg-muted"
              >
                See the workflow
              </a>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6">
              {[
                ["94.3%", "Leaf disease accuracy"],
                ["6", "Fused data sources"],
                ["3 days", "Median early warning"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="font-display text-2xl font-semibold text-primary">{v}</dt>
                  <dd className="text-xs text-muted-foreground">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-border bg-surface p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  ProCrop health score
                </p>
                <span className="rounded-full bg-risk-moderate/15 px-3 py-1 text-xs font-semibold text-risk-moderate">
                  Moderate risk
                </span>
              </div>
              <p className="mt-4 font-display text-6xl font-semibold">78</p>
              <p className="text-sm text-muted-foreground">/ 100 across 5 fields</p>
              <div className="mt-6 space-y-3">
                {[
                  ["Soil condition", 74, "bg-risk-moderate"],
                  ["Environment", 66, "bg-risk-high"],
                  ["Disease risk", 22, "bg-risk-critical"],
                  ["Pest risk", 46, "bg-risk-high"],
                ].map(([label, v, tone]) => (
                  <div key={label as string}>
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground/70">{label}</span>
                      <span className="font-semibold">{v}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-muted">
                      <div
                        className={`h-2 rounded-full ${tone as string}`}
                        style={{ width: `${v as number}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl bg-primary/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Top recommendation
                </p>
                <p className="mt-1 text-sm font-medium">
                  Spray protectant fungicide on Sector 4 within 24 hours.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Driven by 9.2 h leaf wetness and 84% humidity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="border-b border-border py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-3xl font-semibold">How ProCrop works</h2>
          <p className="mt-3 max-w-2xl text-foreground/70">
            A risk-driven pipeline: structured agronomy data is analysed first, and imagery is only
            requested when the models see elevated pressure.
          </p>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workflow.map((s, i) => (
              <li
                key={s.title}
                className="rounded-2xl border border-border bg-surface p-5 shadow-soft"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon name={s.icon} />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Stage {i + 1}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-foreground/70">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="features" className="border-b border-border bg-surface/50 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-3xl font-semibold">One platform, every signal</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-surface p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-vitality/15 text-primary">
                  <Icon name={f.icon} />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-foreground/70">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <h2 className="font-display text-4xl font-semibold">
            Stop reacting to symptoms. Start acting on risk.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-foreground/70">
            Open the ProCrop dashboard to see live field scores, explainable risk predictions and
            the day&apos;s recommended actions.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/dashboard"
              className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Open dashboard
            </Link>
            <Link
              to="/auth"
              className="rounded-xl border border-border bg-surface px-6 py-3 font-semibold hover:bg-muted"
            >
              Create an account
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-surface py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 text-sm text-muted-foreground">
          <p>© 2026 ProCrop — AI-powered agricultural decision support.</p>
          <div className="flex gap-5">
            <Link to="/about" className="hover:text-primary">About</Link>
            <Link to="/help" className="hover:text-primary">Help</Link>
            <Link to="/dashboard" className="hover:text-primary">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
