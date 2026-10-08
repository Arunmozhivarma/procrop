import { createFileRoute, Link } from "@tanstack/react-router";
import { Icon } from "@/components/Icon";
import {
  DataRow,
  PageHeader,
  Panel,
  RangeBar,
  RiskBadge,
  ScoreRing,
  StatTile,
} from "@/components/procrop/ui";
import {
  alerts,
  fields,
  formatDateTime,
  platformScores,
  recommendations,
  riskFromScore,
} from "@/lib/procrop-data";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Jassid Risk Dashboard — ProCrop" },
      {
        name: "description",
        content:
          "Next-week Jassid risk prediction for Coimbatore cotton. Current pest score, field health and priority actions.",
      },
      { property: "og:title", content: "Jassid Risk Dashboard — ProCrop" },
      {
        property: "og:description",
        content:
          "Next-week Jassid risk prediction for Coimbatore cotton. Current pest score, field health and priority actions.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const cottonField = fields[0];
  const activeAlerts = alerts.filter((a) => !a.read);
  const criticalAction = recommendations.find((r) => r.priority === "critical");

  return (
    <div className="space-y-6 px-5 py-8 md:px-8">
      {/* Header with Title and Quick Navigation Badges */}
      <PageHeader
        eyebrow="Monitor · Coimbatore Cotton Intelligence"
        title="Jassid Risk Dashboard"
        description="Next-week Jassid risk prediction for Coimbatore cotton — current pest score, field health and priority scouting actions."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <Icon name="calendar_today" className="text-[15px]" />
              Current: SMW 37 · Forecast: SMW 38
            </span>
            <Link
              to="/risk"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              <Icon name="analytics" className="text-[15px] text-primary" />
              Risk Engine
            </Link>
            <Link
              to="/recommendations"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              <Icon name="checklist" className="text-[15px] text-primary" />
              Scouting Tasks
            </Link>
          </div>
        }
      />

      {/* Top Level Metric / KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon="readiness_score"
          label="Jassid Pest Risk"
          value={platformScores.pest}
          unit="/ 100"
          level="high"
          hint="SMW 37 · Elevated risk zone"
          to="/risk"
        />
        <StatTile
          icon="pest_control"
          label="Current Pest Count"
          value="2.1"
          unit="/ 3 leaves"
          level="high"
          hint="Threshold: ≥ 1.95 (AICRP)"
          to="/analysis"
        />
        <StatTile
          icon="agriculture"
          label="Field Health Index"
          value={cottonField?.healthScore ?? 68}
          unit="/ 100"
          level="moderate"
          hint="Boll formation · 12.4 ha plot"
          to="/farms"
        />
        <StatTile
          icon="checklist"
          label="Scouting Actions"
          value={recommendations.length}
          unit="tasks"
          level="high"
          hint={criticalAction ? "1 critical spray required" : "Routine scouting active"}
          to="/recommendations"
        />
      </div>

      {/* Main Balanced Analytical Grid (2 equal columns on desktop) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-stretch">
        {/* Row 1 - Left: Jassid Pest Risk Score & ML Forecast */}
        <Panel
          title="Jassid pest risk score"
          subtitle="Machine learning ensemble forecast (RF + XGBoost)"
          icon="readiness_score"
          action={
            <Link
              to="/risk"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:underline"
            >
              View SHAP details
              <Icon name="arrow_forward" className="text-[14px]" />
            </Link>
          }
        >
          <div className="flex flex-col justify-between h-full space-y-5">
            <div className="flex flex-col sm:flex-row items-center gap-6 pt-1">
              <ScoreRing
                value={platformScores.pest}
                level={riskFromScore(100 - platformScores.pest)}
                size={160}
                label="Jassid risk"
                sublabel="High Risk"
              />
              <div className="w-full flex-1">
                <DataRow label="Current count" value="2.1 / 3 leaves (SMW 37)" />
                <DataRow label="Classification threshold" value="≥ 1.95 (experimental)" />
                <DataRow
                  label="Next-week forecast"
                  value={
                    <span className="inline-flex items-center gap-1.5 font-bold text-critical">
                      <span className="h-2 w-2 rounded-full bg-critical animate-pulse" />
                      HIGH risk (SMW 38)
                    </span>
                  }
                />
                <DataRow label="Model confidence" value="88% (Ensemble)" />
                <DataRow label="Top predictive feature" value="jassid_lag_1 (+0.42)" />
              </div>
            </div>

            {/* Threshold disclaimer callout */}
            <div className="rounded-xl border border-border/80 bg-muted/40 p-3.5 text-xs leading-relaxed text-foreground/75">
              <div className="flex items-start gap-2.5">
                <Icon name="info" className="mt-0.5 shrink-0 text-[16px] text-primary" />
                <p>
                  <strong className="font-semibold text-foreground">Classification note:</strong>{" "}
                  The HIGH/LOW threshold of ≥ 1.95 Jassids/3 leaves is a median-derived research
                  rule from AICRP Coimbatore data, not an official ICAR economic threshold level
                  (ETL).
                </p>
              </div>
            </div>
          </div>
        </Panel>

        {/* Row 1 - Right: Cotton Field Health & Crop Status */}
        <Panel
          title="Cotton field health"
          subtitle="Coimbatore trial plot vitality and stage monitoring"
          icon="agriculture"
          action={
            <Link
              to="/farms"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:underline"
            >
              Field records
              <Icon name="arrow_forward" className="text-[14px]" />
            </Link>
          }
        >
          {cottonField ? (
            <div className="flex flex-col justify-between h-full space-y-4">
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display font-semibold text-foreground">{cottonField.name}</p>
                  <RiskBadge level={riskFromScore(cottonField.healthScore)} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {cottonField.crop} ({cottonField.variety}) · {cottonField.growthStage} ·{" "}
                  {cottonField.areaHa} ha · Coimbatore
                </p>

                {/* Health Score Range Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Plot Vitality Index</span>
                    <span className="font-semibold text-foreground">
                      {cottonField.healthScore} / 100
                    </span>
                  </div>
                  <RangeBar value={cottonField.healthScore} range={[0, 100]} ideal={[70, 100]} />
                </div>

                {/* Growth Stage Progress */}
                <div className="mt-4 pt-3 border-t border-border/60">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Growth Stage Progress</span>
                    <span className="text-primary font-semibold">
                      {cottonField.growthStage} · {cottonField.stageProgress}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${cottonField.stageProgress}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                    <span>Sown: Jun 10</span>
                    <span>Last inspect: {cottonField.lastInspection}</span>
                  </div>
                </div>
              </div>

              {/* Agronomic Observation */}
              <div className="rounded-xl border border-warning/30 bg-warning/10 p-3.5 text-xs text-foreground/85">
                <div className="flex items-start gap-2.5">
                  <Icon name="warning" className="mt-0.5 shrink-0 text-[16px] text-accent" />
                  <p className="leading-relaxed">
                    <strong className="font-semibold text-foreground">Field Alert:</strong>{" "}
                    {cottonField.notes}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </Panel>

        {/* Row 2 - Left: Priority Scouting Actions */}
        <Panel
          title="Priority scouting actions"
          subtitle="Agronomic recommendations based on pest threshold"
          icon="checklist"
          action={
            <Link
              to="/recommendations"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:underline"
            >
              View all ({recommendations.length})
              <Icon name="arrow_forward" className="text-[14px]" />
            </Link>
          }
        >
          <div className="flex flex-col justify-between h-full">
            <ul className="space-y-3">
              {recommendations.slice(0, 3).map((r) => (
                <li
                  key={r.id}
                  className="group rounded-xl border border-border bg-background/50 p-4 transition-all hover:border-primary/40 hover:bg-background"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon name={r.icon ?? "checklist"} className="text-[16px]" />
                      </span>
                      <p className="font-medium text-sm text-foreground">{r.title}</p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                        r.priority === "critical"
                          ? "bg-critical/15 text-critical border border-critical/30"
                          : r.priority === "high"
                            ? "bg-warning/20 text-accent border border-warning/40"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {r.priority}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-foreground/70">{r.summary}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground border-t border-border/50 pt-2.5">
                    <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                      <Icon name="schedule" className="text-[13px]" />
                      {r.window}
                    </span>
                    <span>·</span>
                    <span>{r.effort}</span>
                    <span>·</span>
                    <span className="text-primary font-medium">{r.impact}</span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {recommendations.filter((r) => r.status === "pending").length} pending interventions
              </span>
              <Link
                to="/recommendations"
                className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                Log completion
                <Icon name="check" className="text-[14px]" />
              </Link>
            </div>
          </div>
        </Panel>

        {/* Row 2 - Right: Recent Field Alerts */}
        <Panel
          title="Recent alerts"
          subtitle="Real-time alerts and trigger notifications"
          icon="notifications"
          action={
            <Link
              to="/alerts"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:underline"
            >
              All alerts ({alerts.length})
              <Icon name="arrow_forward" className="text-[14px]" />
            </Link>
          }
        >
          <div className="flex flex-col justify-between h-full">
            <ul className="space-y-3">
              {alerts.slice(0, 4).map((a) => (
                <li
                  key={a.id}
                  className="flex flex-col gap-1.5 rounded-xl border border-border bg-background/50 p-3.5 transition-colors hover:bg-background"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          a.severity === "critical"
                            ? "bg-critical"
                            : a.severity === "high"
                              ? "bg-accent"
                              : "bg-vitality"
                        }`}
                      />
                      <p className="text-xs sm:text-sm font-medium text-foreground">{a.title}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatDateTime(a.createdAt)}
                    </span>
                  </div>
                  <p className="pl-4 text-xs text-foreground/65 leading-relaxed">{a.body}</p>
                  {a.action ? (
                    <div className="pl-4 pt-1">
                      <Link
                        to={a.action.to}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                      >
                        {a.action.label}
                        <Icon name="arrow_forward" className="text-[12px]" />
                      </Link>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>

            <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
              <span>{activeAlerts.length} unread alerts</span>
              <Link
                to="/alerts"
                className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                Mark all as read
                <Icon name="done_all" className="text-[14px]" />
              </Link>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
