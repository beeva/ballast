import { z } from "zod";
import { inArray } from "drizzle-orm";
import type { db as DbClient } from "@/lib/db/client";
import { metrics, services } from "@/lib/db/schema";

export type Db = typeof DbClient;

export const metricPointSchema = z.object({
  serviceSlug: z.string().min(1),
  metricName: z.string().min(1).max(80),
  value: z.number().finite(),
});

export const ingestRequestSchema = z.union([metricPointSchema, z.array(metricPointSchema).min(1).max(500)]);

export type IngestResult = { ok: true; inserted: number } | { ok: false; error: string };

/**
 * Inserts a batch of metric points, resolving each point's service slug to
 * an id first. A point for an unknown slug fails the whole batch rather
 * than silently dropping just that point - a typo'd slug in a metrics
 * agent's config should be loud, not a metric that quietly never shows up.
 */
export async function ingestMetrics(db: Db, input: z.infer<typeof ingestRequestSchema>): Promise<IngestResult> {
  const points = Array.isArray(input) ? input : [input];

  const uniqueSlugs = [...new Set(points.map((p) => p.serviceSlug))];
  const serviceRows = await db.select().from(services).where(inArray(services.slug, uniqueSlugs));
  const slugToId = new Map(serviceRows.map((row) => [row.slug, row.id]));

  const unknownSlug = points.find((p) => !slugToId.has(p.serviceSlug));
  if (unknownSlug) {
    return { ok: false, error: `Unknown service slug: "${unknownSlug.serviceSlug}"` };
  }

  await db.insert(metrics).values(
    points.map((p) => ({
      serviceId: slugToId.get(p.serviceSlug)!,
      metricName: p.metricName,
      value: String(p.value),
    }))
  );

  return { ok: true, inserted: points.length };
}
