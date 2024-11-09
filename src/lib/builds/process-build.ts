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

export type ProcessResult =
  | { processed: false }
  | { processed: true; buildId: string; serviceSlug: string; success: boolean; durationMs?: number };

/**
 * Claims and runs the single oldest queued build, if any. The claim itself
 * (select the oldest queued row, mark it running) happens inside one
 * transaction with `FOR UPDATE SKIP LOCKED`, so two worker processes
 * polling at once can never both pick up the same build - the loser's
 * SELECT simply skips the locked row and finds nothing (or the next one).
 * Returns enough about what happened for the caller's poll loop to log
 * real progress instead of staying silent until the queue empties out.
 */
export async function processNextQueuedBuild(db: Db, workspaceRoot: string): Promise<ProcessResult> {
  const build = await db.transaction(async (tx) => {
    const [queued] = await tx
      .select()
      .from(builds)
      .where(eq(builds.status, "queued"))
      .orderBy(asc(builds.queuedAt))
      .limit(1)
      .for("update", { skipLocked: true });
    if (!queued) return null;

    const [claimed] = await tx
      .update(builds)
      .set({ status: "running", startedAt: new Date() })
      .where(eq(builds.id, queued.id))
      .returning();
    return claimed ?? null;
  });
  if (!build) return { processed: false };

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
    return { processed: true, buildId: build.id, serviceSlug: "(deleted service)", success: false };
  }

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

  return {
    processed: true,
    buildId: build.id,
    serviceSlug: service.slug,
    success: result.success,
    durationMs: result.durationMs,
  };
}
