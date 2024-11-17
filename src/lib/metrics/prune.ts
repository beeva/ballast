import { lt } from "drizzle-orm";
import type { db as DbClient } from "@/lib/db/client";
import { metrics } from "@/lib/db/schema";

export type Db = typeof DbClient;

export interface PruneResult {
  deletedCount: number;
  cutoff: Date;
}

/**
 * Deletes every metric point recorded before cutoff. Retention has no
 * default here on purpose - the caller (scripts/prune-metrics.ts) decides
 * the window and always logs it, so a cron job's crontab entry is the one
 * source of truth for "how far back do we keep points," not a buried
 * constant.
 */
export async function pruneMetricsOlderThan(db: Db, cutoff: Date): Promise<PruneResult> {
  const deleted = await db.delete(metrics).where(lt(metrics.recordedAt, cutoff)).returning({ id: metrics.id });
  return { deletedCount: deleted.length, cutoff };
}

/** How many points would pruneMetricsOlderThan delete, without deleting them - backs --dry-run. */
export async function countMetricsOlderThan(db: Db, cutoff: Date): Promise<number> {
  const rows = await db.select({ id: metrics.id }).from(metrics).where(lt(metrics.recordedAt, cutoff));
  return rows.length;
}
