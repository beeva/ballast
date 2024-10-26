import path from "node:path";
import { and, asc, eq } from "drizzle-orm";
import type { db as DbClient } from "@/lib/db/client";
import { builds, services } from "@/lib/db/schema";
import { runBuild } from "./runner";

// A type-only import of the app's db client - erased at compile time, so
// it never pulls in client.ts's `server-only` guard at runtime. The worker
// script runs under plain Node (via tsx), not Next's bundler, so it opens
// its own connection (see scripts/run-worker.ts) and passes it in here
// rather than importing the server-only-guarded singleton directly.
export type Db = typeof DbClient;

/**
 * Claims and runs the single oldest queued build, if any. Returns whether
 * it found work to do, so the caller's poll loop can back off when idle
 * instead of hammering the database. Marks the build `running` before
 * doing anything else, so a worker crash mid-build leaves a build stuck in
 * `running` rather than silently re-queued and re-run from scratch.
 */
export async function processNextQueuedBuild(db: Db, workspaceRoot: string): Promise<boolean> {
  const [build] = await db.select().from(builds).where(eq(builds.status, "queued")).orderBy(asc(builds.queuedAt)).limit(1);
  if (!build) return false;

  const [service] = await db.select().from(services).where(eq(services.id, build.serviceId));
  if (!service) {
    await db
      .update(builds)
      .set({
        status: "failed",
        errorMessage: "service was deleted before this build could run",
        finishedAt: new Date(),
      })
      .where(eq(builds.id, build.id));
    return true;
  }

  const startedAt = new Date();
  await db.update(builds).set({ status: "running", startedAt }).where(eq(builds.id, build.id));

  const result = await runBuild({
    repoUrl: service.repoUrl,
    buildCommand: service.buildCommand,
    workingDirectory: service.workingDirectory,
    workspaceDir: path.join(workspaceRoot, build.id),
  });

  await db
    .update(builds)
    .set({
      status: result.success ? "success" : "failed",
      logs: result.logs,
      errorMessage: result.errorMessage,
      finishedAt: new Date(),
      durationMs: result.durationMs,
    })
    .where(and(eq(builds.id, build.id), eq(builds.status, "running")));

  return true;
}
