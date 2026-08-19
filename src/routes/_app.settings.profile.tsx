import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { DataRow } from "@/components/procrop/ui";
import { farms } from "@/lib/procrop-data";

export const Route = createFileRoute("/_app/settings/profile")({
  head: () => ({
    meta: [
      { title: "Settings — ProCrop" },
      { name: "description", content: "Profile, farm defaults, alert thresholds and notification channels." },
      { property: "og:title", content: "Settings — ProCrop" },
      { property: "og:description", content: "Profile, farm defaults, alert thresholds and notification channels." },
    ],
  }),
  component: SettingsProfilePage,
});

function SettingsProfilePage() {
  return (
    <div className="px-5 py-8 md:px-8">
      <PageHeader eyebrow="Manage" title="Settings" description="Profile, farm defaults, alert thresholds and notification channels." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Profile" icon="person">
          <div className="space-y-2 text-sm">
            <DataRow label="Name" value="Uma Vardhan" />
            <DataRow label="Role" value="Farm manager" />
            <DataRow label="Email" value="uma@procrop.in" />
            <DataRow label="Phone" value="+91 98765 43210" />
          </div>
        </Panel>
        <Panel title="Alert preferences" icon="tune">
          <div className="space-y-2 text-sm">
            <DataRow label="Disease risk threshold" value="60%" />
            <DataRow label="Pest risk threshold" value="55%" />
            <DataRow label="Soil moisture floor" value="35%" />
            <DataRow label="Channels" value="In-app, SMS, email" />
          </div>
        </Panel>
        <Panel title="Farms" icon="agriculture" className="lg:col-span-2">
          <div className="space-y-2 text-sm">
            {farms.map((f) => (
              <DataRow key={f.id} label={f.name} value={`${f.location} · ${f.totalHa} ha`} />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
