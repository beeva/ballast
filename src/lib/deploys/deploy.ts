import { and, eq } from "drizzle-orm";
import type { db as DbClient } from "@/lib/db/client";
import { builds, deploys, services } from "@/lib/db/schema";

export type Db = typeof DbClient;

export type DeployResult = { ok: true; deployId: string; isRollback: boolean } | { ok: false; error: string };

/**
 * Deploys a build for a service: supersedes whatever's currently active,
 * inserts a new active deploy row. Nothing is mutated or deleted - a
 * rollback is exactly this same operation pointed at an older build, which
 * is why isRollback is derived from "has this build already been deployed
 * for this service before" rather than being a separate code path.
 *
 * The whole read-check-write sequence runs in one transaction, locking the
 * service row with FOR UPDATE first. That gives two concurrent deploys of
 * the same service a real serialization point even on a service's very
 * first deploy, when there's no active deploy row yet to lock - without
 * it, two concurrent calls could both see "no active deploy", both
 * supersede nothing, and both insert an active row.
 */
export async function deployBuild(
  db: Db,
  params: { serviceId: string; buildId: string; deployedBy: string }
): Promise<DeployResult> {
  return db.transaction(async (tx) => {
    const [service] = await tx.select().from(services).where(eq(services.id, params.serviceId)).for("update");
    if (!service) return { ok: false, error: "Service not found." };

    const [build] = await tx.select().from(builds).where(eq(builds.id, params.buildId));
    if (!build) return { ok: false, error: "Build not found." };
    if (build.serviceId !== params.serviceId) return { ok: false, error: "Build does not belong to this service." };
    if (build.status !== "success") return { ok: false, error: `Cannot deploy a build with status "${build.status}".` };

    const priorDeployOfThisBuild = await tx
      .select()
      .from(deploys)
      .where(and(eq(deploys.serviceId, params.serviceId), eq(deploys.buildId, params.buildId)));
    const isRollback = priorDeployOfThisBuild.length > 0;

    await tx
      .update(deploys)
      .set({ status: "superseded" })
      .where(and(eq(deploys.serviceId, params.serviceId), eq(deploys.status, "active")));

    const [inserted] = await tx
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
  });
}
