import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { DataRow } from "@/components/procrop/ui";

export const Route = createFileRoute("/_app/about")({
  head: () => ({
    meta: [
      { title: "About ProCrop — ProCrop" },
      { name: "description", content: "The problem, the approach and the technology behind the platform." },
      { property: "og:title", content: "About ProCrop — ProCrop" },
      { property: "og:description", content: "The problem, the approach and the technology behind the platform." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="px-5 py-8 md:px-8">
      <PageHeader eyebrow="Manage" title="About ProCrop" description="The problem, the approach and the technology behind the platform." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="The problem" icon="help_center">
          <p className="text-sm text-foreground/70">
            Farmers usually detect disease and pest damage only after visible symptoms appear, when
            yield loss is already locked in. Soil and weather data live in separate tools and are
            rarely combined with what the crop actually looks like.
          </p>
        </Panel>
        <Panel title="The approach" icon="hub">
          <p className="text-sm text-foreground/70">
            ProCrop fuses soil parameters, environmental conditions, crop history and leaf imagery.
            Structured models score risk first; imagery is requested only when risk is elevated, and
            every output is explained before it becomes a recommendation.
          </p>
        </Panel>
        <Panel title="Technology" icon="memory" className="lg:col-span-2">
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <DataRow label="Backend" value="FastAPI + PostgreSQL" />
            <DataRow label="Frontend" value="React + TanStack Router" />
            <DataRow label="Tabular models" value="Scikit-learn, XGBoost" />
            <DataRow label="Vision models" value="PyTorch / TensorFlow CNN" />
            <DataRow label="Explainability" value="SHAP, Grad-CAM" />
            <DataRow label="Edge sensing" value="ESP32 / ESP8266" />
          </div>
        </Panel>
      </div>
    </div>
  );
}
