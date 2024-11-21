import Link from "next/link";
import { notFound } from "next/navigation";
import { getBuildById } from "@/lib/db/queries";
import { BUILD_STATUS_LABEL, BUILD_STATUS_TONE, isBuildStatus } from "@/lib/status";
import { formatDate, formatDuration } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { CopyLogsButton } from "./copy-logs-button";

export default async function BuildDetailPage({
  params,
}: {
  params: Promise<{ slug: string; buildId: string }>;
}) {
  const { slug, buildId } = await params;
  const build = await getBuildById(buildId);
  if (!build || build.serviceSlug !== slug) notFound();

  const status = isBuildStatus(build.status) ? build.status : "queued";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/admin/services/${slug}`} className="text-sm text-copper-400 hover:underline">
          &larr; {build.serviceName}
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="font-display text-2xl text-iron-50">Build {build.id.slice(0, 8)}</h1>
          <Badge tone={BUILD_STATUS_TONE[status]}>{BUILD_STATUS_LABEL[status]}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-iron-400">Queued</p>
          <p className="mt-1 text-sm text-iron-100">{formatDate(build.queuedAt)}</p>
        </Card>
        <Card>
          <p className="text-sm text-iron-400">Duration</p>
          <p className="mt-1 text-sm text-iron-100">
            {build.durationMs !== null ? formatDuration(build.durationMs) : "not finished"}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-iron-400">Commit ref</p>
          <p className="mt-1 font-mono text-sm text-iron-100">{build.commitRef}</p>
        </Card>
      </div>

      {build.errorMessage && (
        <Card className="border-l-4 border-l-red-500/60">
          <p className="text-sm text-iron-400">Error</p>
          <p className="mt-1 text-sm text-red-400">{build.errorMessage}</p>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Full log</CardTitle>
          {build.logs && <CopyLogsButton logs={build.logs} />}
        </div>
        <pre className="scrollbar-thin mt-4 max-h-[32rem] overflow-auto rounded-lg bg-iron-950 p-4 font-mono text-xs text-iron-200">
          {build.logs || "(no output captured)"}
        </pre>
      </Card>
    </div>
  );
}
