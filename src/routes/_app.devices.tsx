import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { DataRow } from "@/components/procrop/ui";
import { devices, formatDateTime } from "@/lib/procrop-data";

export const Route = createFileRoute("/_app/devices")({
  head: () => ({
    meta: [
      { title: "IoT devices — ProCrop" },
      {
        name: "description",
        content: "ESP32 and ESP8266 sensor nodes streaming soil and environment readings.",
      },
      { property: "og:title", content: "IoT devices — ProCrop" },
      {
        property: "og:description",
        content: "ESP32 and ESP8266 sensor nodes streaming soil and environment readings.",
      },
    ],
  }),
  component: DevicesPage,
});

function DevicesPage() {
  return (
    <div className="px-5 py-8 md:px-8">
      <PageHeader
        eyebrow="Sense"
        title="IoT devices"
        description="ESP32 and ESP8266 sensor nodes streaming soil and environment readings."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {devices.map((d) => (
          <Panel key={d.id} title={d.name} subtitle={d.model} icon="sensors">
            <div className="space-y-2 text-sm">
              <DataRow label="Status" value={<Tag>{d.status}</Tag>} />
              <DataRow label="Battery" value={`${d.battery}%`} />
              <DataRow label="Signal" value={`${d.signal}%`} />
              <DataRow label="Last seen" value={formatDateTime(d.lastSeen)} />
              <DataRow label="Sensors" value={d.sensors.join(", ")} />
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
