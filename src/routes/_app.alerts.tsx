import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { RiskBadge } from "@/components/procrop/ui";
import { alerts, formatDateTime } from "@/lib/procrop-data";

export const Route = createFileRoute("/_app/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts — Jassid Risk — ProCrop" },
      {
        name: "description",
        content:
          "Jassid threshold breach alerts, weather warnings and data pipeline notifications for Coimbatore cotton.",
      },
      { property: "og:title", content: "Alerts — Jassid Risk — ProCrop" },
      {
        property: "og:description",
        content:
          "Jassid threshold breach alerts, weather warnings and data pipeline notifications for Coimbatore cotton.",
      },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  return (
    <div className="px-5 py-8 md:px-8">
      <PageHeader
        eyebrow="Act"
        title="Alerts"
        description="Jassid threshold breach alerts, weather warnings and data pipeline notifications for Coimbatore cotton."
      />
      <div className="space-y-3">
        {alerts.map((a) => (
          <Panel
            key={a.id}
            title={a.title}
            subtitle={formatDateTime(a.createdAt)}
            icon="notifications"
          >
            <p className="text-sm text-foreground/70">{a.body}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <RiskBadge level={a.severity} />
              <Tag>{a.read ? "Read" : "Unread"}</Tag>
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
