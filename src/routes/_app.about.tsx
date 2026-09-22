import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { DataRow } from "@/components/procrop/ui";

export const Route = createFileRoute("/_app/about")({
  head: () => ({
    meta: [
      { title: "About this Project — ProCrop" },
      {
        name: "description",
        content:
          "ML-based prediction of next-week Cotton Jassid risk using weather and historical pest data — Coimbatore.",
      },
      { property: "og:title", content: "About this Project — ProCrop" },
      {
        property: "og:description",
        content:
          "ML-based prediction of next-week Cotton Jassid risk using weather and historical pest data — Coimbatore.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="px-5 py-8 md:px-8">
      <PageHeader
        eyebrow="Manage"
        title="About this Project"
        description="Machine Learning-Based Prediction of Next-Week Cotton Jassid Risk Using Weather and Historical Pest Data — Coimbatore."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="The problem" icon="help_center">
          <p className="text-sm text-foreground/70">
            Jassid (<em>Amrasca biguttula biguttula</em>) is a major sap-sucking pest of cotton.
            Conventional scouting detects damage only after the population has already built up,
            meaning spray interventions are reactive rather than preventive. Pest counts vary with
            weather — humidity, temperature, rainfall and sunshine hours all influence Jassid
            population dynamics — but farmers rarely have access to a tool that combines these
            signals into a forward-looking risk prediction.
          </p>
        </Panel>

        <Panel title="The research question" icon="quiz">
          <p className="text-sm text-foreground/70 italic">
            "Can historical weather conditions and recent Jassid population history be used to
            predict next-week Jassid activity and classify cotton pest risk in Coimbatore?"
          </p>
          <p className="mt-3 text-sm text-foreground/70">
            Two experiments compare weather-only inputs (Exp A) against weather combined with
            Jassid lag features (Exp B), establishing whether past pest counts add predictive
            value beyond weather alone.
          </p>
        </Panel>

        <Panel title="Data sources" icon="database">
          <div className="space-y-3 text-sm text-foreground/70">
            <p>
              <span className="font-semibold text-foreground">Pest data:</span> AICRP on Cotton —
              Table 102 (Jassids per 3 leaves, Coimbatore, South Zone, Kharif seasons).
            </p>
            <p>
              <span className="font-semibold text-foreground">Weather data:</span> IMD weekly
              weather summaries aligned to Standard Meteorological Weeks (SMW).
            </p>
            <p>
              <span className="font-semibold text-foreground">Datasets:</span>{" "}
              <code>01_Final_Jassid_Core.xlsx</code> (50 rows) →{" "}
              <code>02_Jassid_Model_Ready.xlsx</code> (40 rows after lag and target preparation).
            </p>
          </div>
        </Panel>

        <Panel title="Classification threshold" icon="warning">
          <p className="text-sm text-foreground/70">
            The HIGH / LOW risk classification uses a threshold of{" "}
            <strong>≥ 1.95 Jassids per 3 leaves</strong>. This is an{" "}
            <strong>experimental, median-derived research rule</strong> applied to this dataset —
            it is <strong>not an official ICAR Economic Threshold Level (ETL)</strong>.
          </p>
          <p className="mt-3 text-sm text-foreground/70">
            When discussing results: "Since a verified ICAR threshold was not established for this
            dataset, an experimental median-based classification rule was used, with 1.95 Jassids
            per 3 leaves as the cutoff. This is a data-derived research classification and not an
            official ICAR ETL."
          </p>
        </Panel>

        <Panel title="ML pipeline" icon="hub" className="lg:col-span-2">
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="font-semibold text-foreground mb-1">Feature groups</p>
              <ul className="space-y-1 text-foreground/70 text-xs">
                <li>• Current-week weather (8 variables + 2 derived)</li>
                <li>• Previous-week weather (8 lag_1 variables)</li>
                <li>• Jassid lag 1 — previous week count</li>
                <li>• Jassid lag 2 — two weeks earlier count</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Target variables</p>
              <ul className="space-y-1 text-foreground/70 text-xs">
                <li>• target_next_week_jassid (regression)</li>
                <li>• target_high_risk_median_rule (classification)</li>
              </ul>
            </div>
          </div>
        </Panel>

        <Panel title="Technology" icon="memory" className="lg:col-span-2">
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <DataRow label="Backend" value="FastAPI + PostgreSQL" />
            <DataRow label="Frontend" value="React + TanStack Router" />
            <DataRow label="Tabular models" value="Scikit-learn Random Forest, XGBoost" />
            <DataRow label="Explainability" value="SHAP (feature attributions)" />
            <DataRow label="Data source" value="AICRP Cotton + IMD Weather, Coimbatore" />
            <DataRow label="Scope" value="Cotton · Jassid · South Zone · Kharif" />
          </div>
        </Panel>
      </div>
    </div>
  );
}
