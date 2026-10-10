import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel } from "@/components/procrop/ui";
import { DataRow } from "@/components/procrop/ui";
import { Icon } from "@/components/Icon";

export const Route = createFileRoute("/_app/settings/profile")({
  head: () => ({
    meta: [
      { title: "Settings — ProCrop" },
      {
        name: "description",
        content: "User profile, agronomic defaults, telemetry preferences and station configuration.",
      },
      { property: "og:title", content: "Settings — ProCrop" },
      {
        property: "og:description",
        content: "User profile, agronomic defaults, telemetry preferences and station configuration.",
      },
    ],
  }),
  component: SettingsProfilePage,
});

function SettingsProfilePage() {
  const [name, setName] = useState("Dr. K. Ramesh");
  const [email, setEmail] = useState("farmer@procrop.in");
  const [phone, setPhone] = useState("+91 94432 10890");
  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form edit states
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = window.localStorage.getItem("procrop.name");
      const storedEmail = window.localStorage.getItem("procrop.email");
      if (storedName) setName(storedName);
      if (storedEmail) setEmail(storedEmail);
      setEditName(storedName || "Dr. K. Ramesh");
      setEditEmail(storedEmail || "farmer@procrop.in");
      setEditPhone("+91 94432 10890");
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setName(editName);
    setEmail(editEmail);
    setPhone(editPhone);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("procrop.name", editName);
      window.localStorage.setItem("procrop.email", editEmail);
      window.localStorage.setItem("procrop.session", editEmail);
    }

    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "KR";

  return (
    <div className="px-5 py-8 md:px-8">
      <PageHeader
        eyebrow="Manage"
        title="Settings & Workspace Preferences"
        description="User identity, agro-climatic parameters, telemetry automation, and research station configurations."
      />

      {savedSuccess && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          <Icon name="check_circle" className="text-[18px]" />
          Profile settings updated and synced with your login credentials!
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Profile Panel (Matched from Login) */}
        <Panel title="User Account Profile" icon="badge">
          {!isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 border-b border-border/60 pb-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 font-display text-xl font-bold text-primary shadow-sm">
                  {initials}
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground">{name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{email}</p>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    Verified Researcher
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <DataRow label="Full Name" value={name} />
                <DataRow label="Email (Mail ID)" value={email} />
                <DataRow label="Phone Number" value={phone} />
                <DataRow label="Assigned Role" value="Lead Agricultural Researcher" />
                <DataRow label="Institution" value="TNAU Cotton Research Station" />
                <DataRow label="Primary Station" value="Coimbatore, Tamil Nadu" />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-muted transition-colors"
                >
                  <Icon name="edit" className="text-[16px] text-primary" />
                  Edit Profile Details
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Email (Mail ID)
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl border border-border bg-muted px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/80"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </Panel>

        <Panel title="Additional settings" icon="settings"><p className="text-sm text-muted-foreground">Regional preferences, farm infrastructure, and telemetry settings are not stored in the current database schema.</p></Panel>
      </div>
    </div>
  );
}
