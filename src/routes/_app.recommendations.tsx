import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { recommendations } from "@/lib/procrop-data";

export const Route = createFileRoute("/_app/recommendations")({
  head: () => ({
    meta: [
      { title: "Recommendations — ProCrop" },
      {
        name: "description",
        content: "Prioritised irrigation, nutrient, spray and scouting actions per field.",
      },
      { property: "og:title", content: "Recommendations — ProCrop" },
      {
        property: "og:description",
        content: "Prioritised irrigation, nutrient, spray and scouting actions per field.",
      },
    ],
  }),
  component: RecommendationsPage,
});

function RecommendationsPage() {
  return (
    <div className="px-5 py-8 md:px-8">
      <PageHeader
        eyebrow="Act"
        title="Recommendations"
        description="Prioritised irrigation, nutrient, spray and scouting actions per field."
      />
      <div className="space-y-4">
        {recommendations.map((r) => (
          <Panel
            key={r.id}
            title={r.title}
            subtitle={`${r.fieldName} · ${r.category}`}
            icon="checklist"
          >
            <p className="text-sm text-foreground/70">{r.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Tag>{r.priority} priority</Tag>
              <Tag>{r.window}</Tag>
              <Tag>{r.impact}</Tag>
            </div>
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
