import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "@/components/Icon";

export const Route = createFileRoute("/_app/care-path")({
  head: () => ({
    meta: [
      { title: "Recovery Plan: Tomato Early Blight — ProCrop Care Path" },
      {
        name: "description",
        content:
          "A systematic 14-day intervention protocol to halt Alternaria solani progression and stabilize tomato crop yield.",
      },
      { property: "og:title", content: "Recovery Plan: Tomato Early Blight — ProCrop" },
      {
        property: "og:description",
        content: "14-day guided intervention protocol to halt early blight and stabilize yield.",
      },
    ],
  }),
  component: CarePath,
});

type Step = {
  id: string;
  phase: string;
  title: string;
  icon: string;
  body: string;
  note?: string;
  tone: "done" | "active" | "upcoming";
  tasks: { id: string; label: string; done: boolean }[];
};

const initialSteps: Step[] = [
  {
    id: "d1",
    phase: "Day 1 • Completed",
    title: "Initial Pruning & Isolation",
    icon: "content_cut",
    body: "Remove all infected lower leaves showing target-spot lesions. Do not compost infected material; destroy or dispose of off-site immediately.",
    tone: "done",
    tasks: [
      { id: "t1", label: "Identify target-spot lesions on lower canopy.", done: true },
      { id: "t2", label: "Sanitize pruning shears with 70% isopropyl alcohol between cuts.", done: true },
    ],
  },
  {
    id: "d2",
    phase: "Day 2-3 • Action Required",
    title: "First Fungicide Application",
    icon: "pest_control",
    body: "Apply broad-spectrum protectant fungicide (Chlorothalonil or Copper-based). Ensure complete coverage of both upper and lower leaf surfaces.",
    note: "Optimal application window: Early morning before temperatures exceed 80°F (27°C) to prevent phytotoxicity.",
    tone: "active",
    tasks: [
      { id: "t3", label: "Calibrate sprayer to 40 PSI for fine mist droplet size.", done: false },
      { id: "t4", label: "Apply 1.5 pt/acre of active ingredient.", done: false },
    ],
  },
  {
    id: "d7",
    phase: "Day 7 • Upcoming",
    title: "Secondary Application & Review",
    icon: "visibility",
    body: "Assess new growth for signs of lesion spreading. Apply secondary systemic fungicide if progression continues.",
    tone: "upcoming",
    tasks: [
      { id: "t5", label: "Inspect mid-canopy leaves for new target spots.", done: false },
      { id: "t6", label: "Apply Azoxystrobin (systemic) rotation if needed.", done: false },
    ],
  },
];

function CarePath() {
  const [steps, setSteps] = useState(initialSteps);

  const allTasks = steps.flatMap((s) => s.tasks);
  const progress = Math.round((allTasks.filter((t) => t.done).length / allTasks.length) * 100);

  const toggle = (stepId: string, taskId: string) =>
    setSteps((prev) =>
      prev.map((s) =>
        s.id !== stepId
          ? s
          : { ...s, tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) },
      ),
    );

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="relative h-64 w-full overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center opacity-60 blur-sm"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC2Eja7MSDhYgWTSnVGb-OHsslKq1ENuW0pGI-cHrYLK0Q0eK7gzgXQ2-U5AnnakhaUgFUiR0Gn3fVw9RboMLCRkoefEKCI4bYTYNDPfdubOkmrdzQYD1xXcutqMSR-XWE65w6ETJOyNWdwru_GPW8VPPxj5SPdsf5nIgbHwj4c-u3zuqnRDsoB5BhgqdWf5HKRMjfznhFoBAqwV7gN97vcxxF7x_l6bxQ1v0IK318vVBL8foaTEzSCmA')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />

        <div className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-border bg-background/85 px-4 py-2 backdrop-blur-md">
          <Link
            to="/diagnostic"
            className="flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            <Icon name="arrow_back" />
            <span className="hidden sm:inline">Back to Diagnostics</span>
          </Link>

          <div className="mx-4 max-w-md flex-1">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Recovery Progress
              </span>
              <span className="text-xs font-semibold text-primary">{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <button className="flex items-center gap-2 rounded border border-border bg-surface px-4 py-2 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-muted">
            <Icon name="share" className="text-[18px]" />
            <span className="hidden sm:inline">Share Plan</span>
          </button>
        </div>

        <div className="absolute bottom-0 left-0 w-full px-4 pb-8 pt-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-sm bg-critical/15 px-3 py-1 text-critical">
            <Icon name="warning" className="text-[16px]" />
            <span className="text-xs font-medium uppercase tracking-wider">Critical Path</span>
          </div>
          <h1 className="mb-2 font-display text-3xl font-semibold text-primary sm:text-[32px]">
            Recovery Plan: Tomato Early Blight
          </h1>
          <p className="mx-auto max-w-2xl text-foreground/70">
            A systematic 14-day intervention protocol to halt Alternaria solani progression and
            stabilize crop yield.
          </p>
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-4 pt-8">
        <div className="relative pb-16 pt-4">
          <div className="absolute bottom-0 left-6 top-6 hidden w-0.5 bg-border sm:block" />
          <div
            className="absolute left-6 top-6 hidden w-0.5 bg-primary transition-all duration-300 sm:block"
            style={{ height: `${progress}%` }}
          />

          {steps.map((step) => (
            <div key={step.id} className="relative mb-8 flex flex-col gap-4 sm:flex-row sm:gap-8">
              <div
                className={`relative z-10 hidden h-12 w-12 shrink-0 items-center justify-center rounded-full sm:flex ${
                  step.tone === "done"
                    ? "border-4 border-background bg-primary text-primary-foreground shadow"
                    : step.tone === "active"
                      ? "border-2 border-primary bg-surface text-primary shadow-sm"
                      : "border-2 border-border bg-surface text-muted-foreground"
                }`}
              >
                <Icon
                  name={step.tone === "done" ? "check" : step.tone === "active" ? "science" : "event"}
                  className={step.tone === "active" ? "animate-pulse" : ""}
                />
              </div>

              <div
                className={`relative flex-1 overflow-hidden rounded p-4 ${
                  step.tone === "active"
                    ? "border border-primary/30 bg-surface shadow-[0_0_15px_rgba(74,103,65,0.08)]"
                    : step.tone === "upcoming"
                      ? "border border-border bg-muted/40 opacity-80"
                      : "border border-border bg-surface"
                }`}
              >
                {step.tone === "active" && (
                  <div className="absolute left-0 top-0 h-full w-1 bg-primary" />
                )}

                <div className="mb-4 flex items-start justify-between border-b border-border pb-2">
                  <div>
                    <span
                      className={`mb-1 block text-xs font-medium uppercase tracking-[0.05em] ${
                        step.tone === "upcoming" ? "text-muted-foreground" : "text-primary"
                      }`}
                    >
                      {step.phase}
                    </span>
                    <h3 className="font-display text-xl font-semibold">{step.title}</h3>
                  </div>
                  <Icon
                    name={step.icon}
                    className={`text-2xl ${step.tone === "active" ? "text-primary" : "text-muted-foreground"}`}
                  />
                </div>

                <p className="mb-4 text-foreground/70">{step.body}</p>

                {step.note && (
                  <div className="mb-4 flex items-start gap-2 rounded border border-border bg-background p-2">
                    <Icon name="thermostat" className="mt-0.5 text-[18px] text-accent" />
                    <p className="text-xs text-foreground/70">{step.note}</p>
                  </div>
                )}

                <div className="space-y-3">
                  {step.tasks.map((t) => (
                    <label
                      key={t.id}
                      className={`group flex items-start gap-3 ${
                        step.tone === "upcoming" ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={t.done}
                        disabled={step.tone === "upcoming"}
                        onChange={() => toggle(step.id, t.id)}
                      />
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border transition-colors ${
                          t.done ? "border-primary bg-primary" : "border-muted-foreground/50 bg-surface"
                        }`}
                      >
                        {t.done && (
                          <svg
                            className="h-3 w-3 text-primary-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M5 13l4 4L19 7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="3"
                            />
                          </svg>
                        )}
                      </span>
                      <span
                        className={`transition-colors group-hover:text-primary ${
                          t.done ? "text-muted-foreground line-through" : ""
                        }`}
                      >
                        {t.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
