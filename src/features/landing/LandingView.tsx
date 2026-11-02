import { Link } from "@tanstack/react-router";
import { Icon } from "@/components/Icon";

export function LandingView() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
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

          <div className="ml-6 flex items-center gap-3">
            <Link
              to="/auth"
              search={{ mode: "login" }}
              className="rounded-xl px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              search={{ mode: "register" }}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border py-20 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-background/50" />
          <div className="relative mx-auto max-w-7xl px-6 text-center">
            <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Predict Next-Week Cotton Jassid Risk
            </h1>
            <p className="mt-5 max-w-2xl mx-auto text-base text-foreground/75 sm:text-lg">
              Machine learning-powered prediction of Jassid pest activity for Coimbatore cotton using
              weather data and historical pest records with explainable AI insights.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/auth"
                search={{ mode: "register" }}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Get Started
                <Icon name="arrow_forward" className="text-sm" />
              </Link>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}