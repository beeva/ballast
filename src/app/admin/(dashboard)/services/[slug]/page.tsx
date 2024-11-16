import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getServiceBySlug,
  getServiceBuildHistory,
  getServiceDeployHistory,
  getRecentMetrics,
} from "@/lib/db/queries";
import { estimateMonthlyCost } from "@/lib/cost/estimate";
import { BUILD_STATUS_LABEL, BUILD_STATUS_TONE, isBuildStatus } from "@/lib/status";
import { formatDuration, formatRelativeTime, truncate } from "@/lib/utils";
import { groupMetricsByName } from "@/lib/metrics/group";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { cancelQueuedBuild, deployBuildAction, triggerBuild } from "../actions";
import { DeleteServiceButton } from "./delete-service-button";

// Trend direction alone doesn't say whether a metric is a "good" or "bad"
// one to see rising (throughput vs. error rate) - so this is a neutral
// glyph, not a red/green good/bad judgment.
const TREND_GLYPH: Record<"up" | "down" | "flat", string> = { up: "▲", down: "▼", flat: "▬" };

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const [buildHistory, deployHistory, recentMetricRows] = await Promise.all([
    getServiceBuildHistory(service.id),
    getServiceDeployHistory(service.id),
    getRecentMetrics(service.id),
  ]);
  const metricGroups = groupMetricsByName(recentMetricRows);

  const activeDeploy = deployHistory.find((d) => d.status === "active");
  const cost = estimateMonthlyCost(service.cpuRequestMilli, service.memoryRequestMb);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-iron-50">{service.name}</h1>
          <p className="mt-1 font-mono text-sm text-iron-400">{service.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <LinkButton href={`/admin/services/${service.slug}/edit`} variant="outline">
            Edit
          </LinkButton>
          <form action={triggerBuild.bind(null, service.id)}>
            <Button type="submit">Trigger build</Button>
          </form>
          <DeleteServiceButton serviceId={service.id} serviceName={service.name} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-iron-400">Build command</p>
          <p className="mt-1 font-mono text-sm text-iron-100">{service.buildCommand}</p>
          {Object.keys(service.envVars).length > 0 && (
            <p className="mt-2 text-xs text-iron-500">
              {Object.keys(service.envVars).length} env var{Object.keys(service.envVars).length === 1 ? "" : "s"} declared
            </p>
          )}
        </Card>
        <Card>
          <p className="text-sm text-iron-400">Resource request</p>
          <p className="mt-1 text-sm text-iron-100">
            {(service.cpuRequestMilli / 1000).toFixed(2)} vCPU · {service.memoryRequestMb} MB
          </p>
        </Card>
        <Card>
          <p className="text-sm text-iron-400">Est. monthly cost</p>
          <p className="mt-1 font-mono text-sm text-iron-100">${cost.totalUsd.toFixed(2)}</p>
        </Card>
      </div>

      <Card>
        <CardTitle>Recent metrics</CardTitle>
        {metricGroups.length === 0 ? (
          <p className="mt-3 text-sm text-iron-400">
            No metrics reported yet - see the docs page for how to send some via POST /api/metrics.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {metricGroups.map((group) => (
              <li key={group.metricName} className="flex flex-col gap-1 border-b border-iron-800 pb-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-iron-100">{group.metricName}</span>
                  <span className="font-mono text-sm text-copper-400">{group.latestValue}</span>
                  {group.trend && <span className="text-xs text-iron-500">{TREND_GLYPH[group.trend]}</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-iron-500">
                  <span className="font-mono">{group.recentValues.slice(1).reverse().join(" · ") || "no prior points"}</span>
                  <span>{formatRelativeTime(group.latestRecordedAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle>Builds</CardTitle>
        {buildHistory.length === 0 ? (
          <p className="mt-3 text-sm text-iron-400">No builds yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {buildHistory.map((build) => {
              const status = isBuildStatus(build.status) ? build.status : "queued";
              const isActive = activeDeploy?.buildId === build.id;
              return (
                <li key={build.id} className="flex flex-col gap-2 border-b border-iron-800 pb-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Badge tone={BUILD_STATUS_TONE[status]}>{BUILD_STATUS_LABEL[status]}</Badge>
                    {isActive && <Badge tone="copper">live</Badge>}
                    <Link
                      href={`/admin/services/${service.slug}/builds/${build.id}`}
                      className="font-mono text-xs text-copper-400 hover:underline"
                    >
                      {truncate(build.id, 8)}
                    </Link>
                    <span className="text-xs text-iron-500">
                      {formatRelativeTime(build.queuedAt)}
                      {build.durationMs !== null ? ` · ${formatDuration(build.durationMs)}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {status === "success" && !isActive && (
                      <form action={deployBuildAction.bind(null, service.id, build.id)}>
                        <Button size="sm" variant="outline" type="submit">
                          Deploy this build
                        </Button>
                      </form>
                    )}
                    {status === "failed" && (
                      <form action={triggerBuild.bind(null, service.id)}>
                        <Button size="sm" variant="outline" type="submit">
                          Retry
                        </Button>
                      </form>
                    )}
                    {status === "queued" && (
                      <form action={cancelQueuedBuild.bind(null, build.id)}>
                        <Button size="sm" variant="outline" type="submit">
                          Cancel
                        </Button>
                      </form>
                    )}
                  </div>
                  {build.errorMessage && <p className="text-xs text-red-400">{build.errorMessage}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle>Deploy history</CardTitle>
        {deployHistory.length === 0 ? (
          <p className="mt-3 text-sm text-iron-400">No deploys yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {deployHistory.map((deploy) => (
              <li key={deploy.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <Badge tone={deploy.status === "active" ? "moss" : "neutral"}>{deploy.status}</Badge>
                  {deploy.isRollback && <Badge tone="copper">rollback</Badge>}
                  <span className="font-mono text-xs text-iron-500">build {truncate(deploy.buildId, 8)}</span>
                </div>
                <span className="text-iron-500">
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
