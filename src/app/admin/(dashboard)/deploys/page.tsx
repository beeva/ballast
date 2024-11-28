import Link from "next/link";
import { getRecentDeploys } from "@/lib/db/queries";
import { formatRelativeTime, truncate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default async function DeploysPage() {
  const deploys = await getRecentDeploys();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-iron-50">Deploys</h1>
        <p className="mt-1 text-sm text-iron-400">
          What&apos;s live and what changed, across every service - most recent first.
        </p>
      </div>

      <Card>
        {deploys.length === 0 ? (
          <p className="py-8 text-center text-sm text-iron-400">No deploys yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {deploys.map((deploy) => (
              <li
                key={deploy.id}
                className="flex flex-col gap-1 border-b border-iron-800 pb-3 text-sm last:border-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <Badge tone={deploy.status === "active" ? "moss" : "neutral"}>{deploy.status}</Badge>
                  {deploy.isRollback && <Badge tone="copper">rollback</Badge>}
                  <Link href={`/admin/services/${deploy.serviceSlug}`} className="text-copper-400 hover:underline">
                    {deploy.serviceName}
                  </Link>
                  <span className="font-mono text-xs text-iron-500">build {truncate(deploy.buildId, 8)}</span>
                </div>
                <span className="text-xs text-iron-500">
                  {deploy.deployedBy} · {formatRelativeTime(deploy.deployedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
