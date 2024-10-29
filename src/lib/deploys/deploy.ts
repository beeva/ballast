import { and, eq } from "drizzle-orm";
import type { db as DbClient } from "@/lib/db/client";
import { builds, deploys } from "@/lib/db/schema";

export type Db = typeof DbClient;

export type DeployResult = { ok: true; deployId: string; isRollback: boolean } | { ok: false; error: string };

/**
 * Deploys a build for a service: supersedes whatever's currently active,
 * inserts a new active deploy row. Nothing is mutated or deleted - a
 * rollback is exactly this same operation pointed at an older build, which
 * is why isRollback is derived from "has this build already been deployed
 * for this service before" rather than being a separate code path.
 */
export async function deployBuild(
  db: Db,
  params: { serviceId: string; buildId: string; deployedBy: string }
): Promise<DeployResult> {
  const [build] = await db.select().from(builds).where(eq(builds.id, params.buildId));
  if (!build) return { ok: false, error: "Build not found." };
  if (build.serviceId !== params.serviceId) return { ok: false, error: "Build does not belong to this service." };
  if (build.status !== "success") return { ok: false, error: `Cannot deploy a build with status "${build.status}".` };

  const priorDeployOfThisBuild = await db
    .select()
    .from(deploys)
    .where(and(eq(deploys.serviceId, params.serviceId), eq(deploys.buildId, params.buildId)));
  const isRollback = priorDeployOfThisBuild.length > 0;

  await db
    .update(deploys)
    .set({ status: "superseded" })
    .where(and(eq(deploys.serviceId, params.serviceId), eq(deploys.status, "active")));

  const [inserted] = await db
    .insert(deploys)
    .values({
      serviceId: params.serviceId,
      buildId: params.buildId,
      status: "active",
      isRollback,
      deployedBy: params.deployedBy,
    })
    .returning({ id: deploys.id });

  if (!inserted) return { ok: false, error: "Deploy row was not created." };
  return { ok: true, deployId: inserted.id, isRollback };
}
