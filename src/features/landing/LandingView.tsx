import { Link } from "@tanstack/react-router";
import { Icon } from "@/components/Icon";

const workflow = [
  {
    icon: "database",
    title: "AICRP Data Collection",
    body: "Weekly Jassid observations per 3 leaves (Table 102) & IMD weather data for Coimbatore.",
  },
  {
    icon: "calendar_month",
    title: "SMW Alignment",
    body: "Aligning weather parameters and pest counts into Standard Meteorological Weeks (SMW 1–50).",
  },
  {
    icon: "tune",
    title: "Lag Feature Engineering",
    body: "Constructing jassid_lag_1, jassid_lag_2 and lagged weather features for temporal context.",
  },
  {
    icon: "timeline",
    title: "Chronological Split",
    body: "Time-series validation split preserving week sequence (no random shuffling).",
  },
  {
    icon: "memory",
    title: "ML Model Training",
    body: "Random Forest & XGBoost trained for regression and HIGH/LOW risk classification.",
  },
  {
    icon: "psychology",
    title: "SHAP Explainability",
    body: "Computing global feature rankings and local feature attributions for every prediction.",
  },
  {
    icon: "pest_control",
    title: "Next-Week Risk Forecast",
    body: "Predicting next-week Jassid count and flagging risk against the 1.95 experimental threshold.",
  },
  {
    icon: "checklist",
    title: "Targeted Action",
    body: "Recommending timely neem oil spray or scouting entries before canopy damage builds up.",
  },
];

const features = [
  {
    icon: "biotech",
    title: "Exp A vs Exp B Comparison",
    body: "Evaluating weather-only features against weather + historical pest lags to prove history value.",
  },
  {
    icon: "dataset",
    title: "AICRP & IMD Datasets",
    body: "Utilising 01_Final_Jassid_Core.xlsx (50 rows) and 02_Jassid_Model_Ready.xlsx (40 model rows).",
  },
  {
    icon: "monitoring",
    title: "Random Forest & XGBoost",
    body: "Dual tree-based models evaluated for regression (MAE, RMSE, R²) and classification (Accuracy, F1).",
  },
  {
    icon: "search",
    title: "SHAP Feature Attribution",
    body: "Explaining how temperature, humidity, rainfall and Jassid lags push risk higher or lower.",
  },
  {
    icon: "report_problem",
    title: "1.95 Median Threshold",
    body: "Data-derived research classification threshold (≥ 1.95 Jassids/3 leaves) for HIGH risk tagging.",
  },
  {
    icon: "location_on",
    title: "Coimbatore Regional Focus",
    body: "Restricted strictly to Kharif cotton in Vertisol soils for defensible research accuracy.",
  },
];

export function LandingView() {
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
            <a href="#how" className="hover:text-primary">
              How it works
            </a>
            <a href="#features" className="hover:text-primary">
              ML Platform
            </a>
            <Link to="/about" className="hover:text-primary">
              About project
            </Link>
            <Link to="/help" className="hover:text-primary">
              Help
            </Link>
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
              TIME-SERIES ML &amp; SHAP EXPLAINABILITY
            </span>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              Prediction of Next-Week Cotton Jassid Risk
            </h1>
            <p className="mt-6 max-w-xl text-lg text-foreground/70">
              Predicting next-week Jassid activity per 3 leaves for Coimbatore cotton using weather
              and historical pest data. Powered by Random Forest, XGBoost and SHAP explainability.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Explore Jassid Dashboard
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
                ["SMW 1–50", "AICRP Coimbatore data"],
                ["90.0%", "Exp B XGBoost accuracy"],
                ["≥ 1.95", "Experimental threshold"],
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
                  Current Jassid Risk (SMW 37)
                </p>
                <span className="rounded-full bg-risk-high/15 px-3 py-1 text-xs font-semibold text-risk-high">
                  HIGH RISK (SMW 38)
                </span>
              </div>
              <p className="mt-4 font-display text-5xl font-semibold">2.1</p>
              <p className="text-sm text-muted-foreground">
                Jassids / 3 leaves (Experimental threshold: ≥ 1.95)
              </p>
              <div className="mt-6 space-y-3">
                {[
                  ["Jassid Lag 1 (SMW 37)", 78, "bg-risk-high", "2.1 / 3 leaves"],
                  ["Mean Relative Humidity", 70, "bg-risk-moderate", "70% (82% morning RH)"],
                  ["Max Temperature", 68, "bg-risk-high", "34.2 °C"],
                  ["Jassid Lag 2 (SMW 36)", 60, "bg-risk-moderate", "1.8 / 3 leaves"],
                ].map(([label, v, tone, detail]) => (
                  <div key={label as string}>
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground/70">{label}</span>
                      <span className="font-semibold">{detail}</span>
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
                  Top predictive insight
                </p>
                <p className="mt-1 text-sm font-medium">
                  HIGH Jassid risk predicted for SMW 38 (≥ 1.95 threshold).
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Driven by Jassid Lag 1 (2.1 count), 82% morning RH, and 34.2 °C max temperature.
                  Recommended action: 3% Neem oil spray within 48 hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="border-b border-border py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-3xl font-semibold">How the Jassid ML pipeline works</h2>
          <p className="mt-3 max-w-2xl text-foreground/70">
            A time-series ML workflow: weather parameters and historical pest counts are aligned into
            Standard Meteorological Weeks, evaluated with Random Forest and XGBoost, and explained
            using SHAP attributions.
          </p>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <h3 className="mt-4 font-display text-base font-semibold">{s.title}</h3>
                <p className="mt-1 text-xs text-foreground/70">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="features" className="border-b border-border bg-surface/50 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-3xl font-semibold">Research &amp; ML Capabilities</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            Predict next-week pest risk before crop damage occurs.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-foreground/70">
            Open the ProCrop dashboard to inspect live Jassid predictions, compare Experiment A vs B
            performance metrics, and analyze SHAP feature attributions.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/dashboard"
              className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Open dashboard
            </Link>
            <Link
              to="/risk"
              className="rounded-xl border border-border bg-surface px-6 py-3 font-semibold hover:bg-muted"
            >
              View Jassid Risk Engine
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-surface py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 text-sm text-muted-foreground">
          <p>© 2026 ProCrop — Machine Learning Cotton Jassid Prediction (Coimbatore, Tamil Nadu).</p>
          <div className="flex gap-5">
            <Link to="/about" className="hover:text-primary">
              About
            </Link>
            <Link to="/help" className="hover:text-primary">
              Help
            </Link>
            <Link to="/dashboard" className="hover:text-primary">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
