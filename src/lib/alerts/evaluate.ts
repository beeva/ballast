import { and, eq, gte } from "drizzle-orm";
import type { db as DbClient } from "@/lib/db/client";
import { alertEvents, alertRules, metrics } from "@/lib/db/schema";
import { average, compareValue, isComparator } from "./threshold";

export type Db = typeof DbClient;

export type EvaluationOutcome = "no-data" | "fired" | "resolved" | "unchanged";

export interface EvaluationResult {
  outcome: EvaluationOutcome;
  currentValue: number | null;
}

/**
 * Evaluates one alert rule against the average of its metric over its own
 * window, and opens/closes an alertEvents row to match. A rule already
 * firing that's still breaching does nothing - alertEvents rows are
 * open-or-resolved incidents, not a log entry per evaluation tick, so
 * "how many times did this actually page someone" stays a meaningful
 * count instead of one row per poll interval.
 */
export async function evaluateAlertRule(
  db: Db,
  rule: typeof alertRules.$inferSelect
): Promise<EvaluationResult> {
  if (!isComparator(rule.comparator)) {
    throw new Error(`Alert rule ${rule.id} has an invalid comparator: ${rule.comparator}`);
  }

  const windowStart = new Date(Date.now() - rule.windowMinutes * 60_000);
  const points = await db
    .select()
    .from(metrics)
    .where(
      and(eq(metrics.serviceId, rule.serviceId), eq(metrics.metricName, rule.metricName), gte(metrics.recordedAt, windowStart))
    );
  const currentValue = average(points.map((p) => Number(p.value)));

  const [existingFiring] = await db
    .select()
    .from(alertEvents)
    .where(and(eq(alertEvents.alertRuleId, rule.id), eq(alertEvents.status, "firing")));

  if (currentValue === null) {
    // No data in the window at all - not the same as "healthy", but also
    // not grounds to open or close an alert on a value we don't have.
    return { outcome: "no-data", currentValue: null };
  }

  const breaching = compareValue(currentValue, rule.comparator, Number(rule.threshold));

  if (breaching && !existingFiring) {
    await db.insert(alertEvents).values({
      alertRuleId: rule.id,
      serviceId: rule.serviceId,
      status: "firing",
      triggerValue: String(currentValue),
    });
    return { outcome: "fired", currentValue };
  }

  if (!breaching && existingFiring) {
    await db
      .update(alertEvents)
      .set({ status: "resolved", resolvedAt: new Date() })
      .where(eq(alertEvents.id, existingFiring.id));
    return { outcome: "resolved", currentValue };
  }

  return { outcome: "unchanged", currentValue };
}
