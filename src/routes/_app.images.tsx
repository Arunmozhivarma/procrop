import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { RiskBadge } from "@/components/procrop/ui";
import { formatDate, imageAnalyses, severityMeta } from "@/lib/procrop-data";

export const Route = createFileRoute("/_app/images")({
  head: () => ({
    meta: [
      { title: "Image analysis — ProCrop" },
      { name: "description", content: "CNN leaf-image diagnoses with severity, confidence and affected leaf area." },
      { property: "og:title", content: "Image analysis — ProCrop" },
      { property: "og:description", content: "CNN leaf-image diagnoses with severity, confidence and affected leaf area." },
    ],
  }),
  component: ImagesPage,
});

function ImagesPage() {
  return (
    <div className="px-5 py-8 md:px-8">
      <PageHeader eyebrow="Predict" title="Image analysis" description="CNN leaf-image diagnoses with severity, confidence and affected leaf area." />
      <div className="grid gap-4 lg:grid-cols-2">
        {imageAnalyses.map((a) => (
          <Panel key={a.id} title={a.label} subtitle={`${a.fieldName} · ${formatDate(a.capturedAt)}`} icon="document_scanner">
            <div className="flex flex-wrap items-center gap-2">
              <RiskBadge level={severityMeta[a.severity].risk} />
              <Tag>Confidence {Math.round(a.confidence * 100)}%</Tag>
              <Tag>Affected {a.affectedArea}%</Tag>
            </div>
            <p className="mt-3 text-sm text-foreground/70">{a.symptoms[0]?.body}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-foreground/70">
      {children}
    </span>
  );
}
