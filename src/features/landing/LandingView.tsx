import { Link } from "@tanstack/react-router";
import { Icon } from "@/components/Icon";

export function LandingView() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
              <Icon name="eco" filled />
            </span>
            <div className="flex flex-col">
              <span className="font-display text-lg font-semibold leading-tight">ProCrop</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                Cotton Intelligence
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              className="rounded-xl px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted"
            >
              Sign in
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Open dashboard
              <Icon name="arrow_forward" className="text-[16px]" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              <Icon name="auto_awesome" className="text-[15px]" />
              AI-Driven Pest Forecasting
            </span>

            <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
              Predict cotton pest risks <br className="hidden sm:inline" />
              before damage occurs.
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base text-foreground/75 sm:text-lg">
              ProCrop combines weather feeds, field scouting history, and machine learning models to
              forecast next-week Jassid pressure and recommend timely interventions.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary/90 hover:shadow-lg"
              >
                Go to Dashboard
                <Icon name="arrow_forward" className="text-[18px]" />
              </Link>
              <Link
                to="/risk"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
              >
                <Icon name="analytics" className="text-[18px] text-primary" />
                View Risk Models
              </Link>
            </div>

            {/* Quick 3-card highlights */}
            <div className="mt-16 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon name="readiness_score" className="text-[20px]" />
                </span>
                <h2 className="mt-3 font-display text-base font-semibold">Next-Week Forecast</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  SMW-based classification models predict High / Low risk a week ahead.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon name="psychology" className="text-[20px]" />
                </span>
                <h2 className="mt-3 font-display text-base font-semibold">Explainable AI</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  SHAP feature attributions show exact weather and lag factors driving each risk
                  score.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon name="checklist" className="text-[20px]" />
                </span>
                <h2 className="mt-3 font-display text-base font-semibold">Scouting Actions</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Targeted field advisories and spray windows based on experimental thresholds.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-border bg-surface py-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 text-xs text-muted-foreground">
          <p>© 2026 ProCrop · TNAU Coimbatore Cotton Research Station</p>
          <div className="flex items-center gap-5">
            <Link to="/about" className="transition-colors hover:text-foreground">
              About
            </Link>
            <Link to="/help" className="transition-colors hover:text-foreground">
              Help
            </Link>
            <Link
              to="/dashboard"
              className="transition-colors hover:text-foreground font-medium text-primary"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
