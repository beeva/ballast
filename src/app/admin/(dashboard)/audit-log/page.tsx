import { getAuditLogPage } from "@/lib/db/queries";
import { formatRelativeTime, truncate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";

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

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ before?: string }>;
}) {
  const { before } = await searchParams;
  const beforeDate = before ? new Date(before) : undefined;
  // An invalid/tampered ?before= falls back to the first page rather than
  // passing an Invalid Date into the query - Postgres would reject it with
  // a confusing error instead of just showing recent activity.
  const { events, hasMore } = await getAuditLogPage(
    beforeDate && !Number.isNaN(beforeDate.getTime()) ? beforeDate : undefined
  );
  const lastEvent = events[events.length - 1];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-iron-50">Audit log</h1>
          <p className="mt-1 text-sm text-iron-400">
            Every admin mutation, most recent first. Entries survive deletion of whatever they
            reference - a deleted service still shows up here as having been deleted.
          </p>
        </div>
        <LinkButton href="/admin/audit-log/export" variant="outline" size="sm">
          Export CSV
        </LinkButton>
      </div>

      <Card>
        {events.length === 0 ? (
          <p className="py-8 text-center text-sm text-iron-400">
            {before ? "No older activity." : "No admin activity recorded yet."}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex flex-col gap-1 border-b border-iron-800 pb-3 text-sm last:border-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-iron-100">{event.actorEmail}</span>
                  <span className="text-iron-400">{ACTION_LABEL[event.action] ?? event.action}</span>
                  {event.detail && <span className="font-mono text-xs text-copper-400">{event.detail}</span>}
                  {!event.detail && event.targetId && (
                    <span className="font-mono text-xs text-iron-500">{truncate(event.targetId, 8)}</span>
                  )}
                </div>
                <span className="text-xs text-iron-500">{formatRelativeTime(event.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {hasMore && lastEvent && (
        <LinkButton
          href={`/admin/audit-log?before=${encodeURIComponent(lastEvent.createdAt.toISOString())}`}
          variant="outline"
          className="self-center"
        >
          Load older activity
        </LinkButton>
      )}
    </div>
  );
}
