import Link from "next/link";
import { getAuditLogPage, getDashboardSummary } from "@/lib/db/queries";
import { BUILD_STATUS_LABEL, BUILD_STATUS_TONE, isBuildStatus } from "@/lib/status";
import { formatDuration, formatRelativeTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const ACTION_LABEL: Record<string, string> = {
  "service.created": "created service",
  "service.updated": "updated service",
  "service.deleted": "deleted service",
  "build.triggered": "triggered build",
  "build.cancelled": "cancelled build",
  "deploy.created": "deployed",
  "deploy.rolled_back": "rolled back to",
  "alert_rule.created": "created alert rule",
  "alert_rule.deleted": "deleted alert rule",
};

export default async function AdminOverviewPage() {
  const [summary, auditPage] = await Promise.all([getDashboardSummary(), getAuditLogPage()]);
  const recentActivity = auditPage.events.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-iron-50">Overview</h1>
        <p className="mt-1 text-sm text-iron-400">
          {summary.serviceCount} service{summary.serviceCount === 1 ? "" : "s"} under management.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-iron-400">Services</p>
          <p className="mt-2 font-display text-3xl text-iron-50">{summary.serviceCount}</p>
        </Card>
        <Card className={summary.activeAlertCount > 0 ? "border-l-4 border-l-red-500/60" : undefined}>
          <p className="text-sm text-iron-400">Firing alerts</p>
          <p className={`mt-2 font-display text-3xl ${summary.activeAlertCount > 0 ? "text-red-400" : "text-iron-50"}`}>
            {summary.activeAlertCount}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-iron-400">Estimated monthly cost</p>
          <p className="mt-2 font-display text-3xl text-iron-50">${summary.fleetCost.totalUsd.toFixed(2)}</p>
        </Card>
      </div>

      <Card>
        <CardTitle>Recent builds</CardTitle>
        {summary.recentBuilds.length === 0 ? (
          <CardDescription className="mt-2">No builds yet.</CardDescription>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {summary.recentBuilds.map((build) => {
              const status = isBuildStatus(build.status) ? build.status : "queued";
              return (
                <li key={build.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Badge tone={BUILD_STATUS_TONE[status]}>{BUILD_STATUS_LABEL[status]}</Badge>
                    <Link href={`/admin/services/${build.serviceSlug}`} className="text-iron-200 hover:text-copper-400">
                      {build.serviceName}
                    </Link>
                  </div>
                  <span className="text-iron-500">
                    {formatRelativeTime(build.queuedAt)}
                    {build.durationMs !== null ? ` · ${formatDuration(build.durationMs)}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Recent activity</CardTitle>
          <Link href="/admin/audit-log" className="text-sm text-copper-400 hover:underline">
            View all
          </Link>
        </div>
        {recentActivity.length === 0 ? (
          <CardDescription className="mt-2">No admin activity recorded yet.</CardDescription>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {recentActivity.map((event) => (
              <li key={event.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-iron-200">{event.actorEmail}</span>
                  <span className="text-iron-400">{ACTION_LABEL[event.action] ?? event.action}</span>
                  {event.detail && <span className="font-mono text-xs text-copper-400">{event.detail}</span>}
                </div>
                <span className="text-iron-500">{formatRelativeTime(event.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
