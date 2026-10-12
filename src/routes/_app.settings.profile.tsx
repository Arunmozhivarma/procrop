import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ButtonLink,
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  Panel,
} from "@/components/procrop/ui";
import { DataRow } from "@/components/procrop/ui";
import { Icon } from "@/components/Icon";
import { errorMessage } from "@/services/api";
import { useCurrentUser, useSignOut, useUpdateProfile } from "@/services/queries";
import { formatDate } from "@/utils/formatters";

export const Route = createFileRoute("/_app/settings/profile")({
  head: () => ({
    meta: [
      { title: "Settings — ProCrop" },
      {
        name: "description",
        content:
          "User profile, agronomic defaults, telemetry preferences and station configuration.",
      },
      { property: "og:title", content: "Settings — ProCrop" },
      {
        property: "og:description",
        content:
          "User profile, agronomic defaults, telemetry preferences and station configuration.",
      },
    ],
  }),
  component: SettingsProfilePage,
});

function SettingsProfilePage() {
  // The profile is the signed-in row of the users table.
  const { user, isSignedIn, isLoading, error, refetch } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const signOut = useSignOut();
  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form edit states
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const startEditing = () => {
    if (!user) return;
    setEditName(user.name);
    setEditEmail(user.email);
    setSaveError(null);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    try {
      await updateProfile.mutateAsync({ name: editName, email: editEmail });
      setIsEditing(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: unknown) {
      setSaveError(errorMessage(err));
    }
  };

  const initials = (user?.name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  // SQLite stores created_at as a UTC "YYYY-MM-DD HH:MM:SS" timestamp.
  const memberSince = user?.created_at ? formatDate(`${user.created_at.replace(" ", "T")}Z`) : "—";

  return (
    <div className="px-5 py-8 md:px-8">
      <PageHeader
        title="Settings"
        description=" About User."
      />

      {savedSuccess && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          <Icon name="check_circle" className="text-[18px]" />
          Profile settings saved to the database.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Profile Panel (users table) */}
        <Panel title="User Account Profile" icon="badge">
          {isLoading ? (
            <LoadingBlock label="Loading your account…" />
          ) : !isSignedIn ? (
            <EmptyState
              icon="person"
              title="You are not signed in"
              body="Sign in or create an account to view and edit your profile."
              action={
                <ButtonLink to="/auth" icon="login">
                  Sign in
                </ButtonLink>
              }
            />
          ) : !user ? (
            <ErrorState
              title="Could not load your account"
              message={error ? errorMessage(error) : "Your account could not be loaded."}
              onRetry={() => refetch()}
            />
          ) : !isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 border-b border-border/60 pb-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 font-display text-xl font-bold text-primary shadow-sm">
                  {initials}
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground">
                    {user.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">{user.email}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <DataRow label="Full Name" value={user.name} />
                <DataRow label="Email (Mail ID)" value={user.email} />
                <DataRow label="Member Since" value={memberSince} />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={startEditing}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-muted transition-colors"
                >
                  <Icon name="edit" className="text-[16px] text-primary" />
                  Edit Profile Details
                </button>
                <button
                  type="button"
                  onClick={signOut}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-muted transition-colors"
                >
                  <Icon name="logout" className="text-[16px] text-primary" />
                  Sign out
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

              {saveError ? (
                <p
                  role="alert"
                  className="flex items-center gap-2 rounded-xl bg-critical/10 px-3 py-2 text-sm text-critical"
                >
                  <Icon name="error" className="text-[18px]" />
                  {saveError}
                </p>
              ) : null}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {updateProfile.isPending ? "Saving…" : "Save Changes"}
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
      </div>
    </div>
  );
}
