import "server-only";
import { and, desc, eq, lt, sql } from "drizzle-orm";
import { db } from "./client";
import { adminUsers, alertEvents, alertRules, auditLog, builds, deploys, metrics, services } from "./schema";
import { estimateFleetMonthlyCost, estimateMonthlyCost } from "@/lib/cost/estimate";

export async function getAdminByEmail(email: string) {
  const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.email, email.toLowerCase()));
  return admin ?? null;
}

export async function getDashboardSummary() {
  const allServices = await db.select().from(services);

  const [alertCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(alertEvents)
    .where(eq(alertEvents.status, "firing"));
  const activeAlertCount = alertCountRow?.count ?? 0;

  const recentBuilds = await db
    .select({
      id: builds.id,
      status: builds.status,
      serviceName: services.name,
      serviceSlug: services.slug,
      queuedAt: builds.queuedAt,
      durationMs: builds.durationMs,
    })
    .from(builds)
    .innerJoin(services, eq(builds.serviceId, services.id))
    .orderBy(desc(builds.queuedAt))
    .limit(10);

  const fleetCost = estimateFleetMonthlyCost(allServices);

  return {
    serviceCount: allServices.length,
    activeAlertCount,
    recentBuilds,
    fleetCost,
  };
}

export async function listServices() {
  return db.select().from(services).orderBy(services.name);
}

export async function listServicesWithActiveDeploy() {
  const allServices = await db.select().from(services).orderBy(services.name);

  const activeDeploys = await db
    .select({
      serviceId: deploys.serviceId,
      buildId: builds.id,
      commitRef: builds.commitRef,
      deployedAt: deploys.deployedAt,
    })
    .from(deploys)
    .innerJoin(builds, eq(deploys.buildId, builds.id))
    .where(eq(deploys.status, "active"));
  const activeByService = new Map(activeDeploys.map((d) => [d.serviceId, d]));

  return allServices.map((service) => ({
    ...service,
    activeDeploy: activeByService.get(service.id) ?? null,
    monthlyCost: estimateMonthlyCost(service.cpuRequestMilli, service.memoryRequestMb),
  }));
}

export async function getServiceBySlug(slug: string) {
  const [service] = await db.select().from(services).where(eq(services.slug, slug));
  return service ?? null;
}

export async function getServiceBuildHistory(serviceId: string, limit = 20) {
  return db.select().from(builds).where(eq(builds.serviceId, serviceId)).orderBy(desc(builds.queuedAt)).limit(limit);
}

export async function getBuildById(buildId: string) {
  const [row] = await db
    .select({
      id: builds.id,
      status: builds.status,
      commitRef: builds.commitRef,
      logs: builds.logs,
      errorMessage: builds.errorMessage,
      queuedAt: builds.queuedAt,
      startedAt: builds.startedAt,
      finishedAt: builds.finishedAt,
      durationMs: builds.durationMs,
      serviceId: services.id,
      serviceName: services.name,
      serviceSlug: services.slug,
    })
    .from(builds)
    .innerJoin(services, eq(builds.serviceId, services.id))
    .where(eq(builds.id, buildId));
  return row ?? null;
}

export async function getServiceDeployHistory(serviceId: string, limit = 20) {
  return db
    .select({
      id: deploys.id,
      status: deploys.status,
      isRollback: deploys.isRollback,
      deployedBy: deploys.deployedBy,
      deployedAt: deploys.deployedAt,
      buildId: builds.id,
      commitRef: builds.commitRef,
    })
    .from(deploys)
    .innerJoin(builds, eq(deploys.buildId, builds.id))
    .where(eq(deploys.serviceId, serviceId))
    .orderBy(desc(deploys.deployedAt))
    .limit(limit);
}

/**
 * Recent raw points across all of a service's metrics, newest first. Capped
 * generously (default 300) since it's grouped by metric name for display,
 * not charted point-by-point - see groupMetricsByName.
 */
export async function getRecentMetrics(serviceId: string, limit = 300) {
  return db
    .select({ metricName: metrics.metricName, value: metrics.value, recordedAt: metrics.recordedAt })
    .from(metrics)
    .where(eq(metrics.serviceId, serviceId))
    .orderBy(desc(metrics.recordedAt))
    .limit(limit);
}

/**
 * Public-facing health per service: just a name and whether it currently
 * has any firing alert - no build/deploy internals, which a status page
 * has no business exposing to an unauthenticated visitor.
 */
export async function getServiceHealthSummary() {
  const allServices = await db.select({ id: services.id, name: services.name, slug: services.slug }).from(services);

  const firingByService = await db
    .select({ serviceId: alertEvents.serviceId, count: sql<number>`count(*)::int` })
    .from(alertEvents)
    .where(eq(alertEvents.status, "firing"))
    .groupBy(alertEvents.serviceId);
  const firingCountByService = new Map(firingByService.map((row) => [row.serviceId, row.count]));

  return allServices
    .map((service) => ({ ...service, firingAlertCount: firingCountByService.get(service.id) ?? 0 }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getServiceAlertRules(serviceId: string) {
  return db.select().from(alertRules).where(eq(alertRules.serviceId, serviceId));
}

export async function getFiringAlertForRule(alertRuleId: string) {
  const [event] = await db
    .select()
    .from(alertEvents)
    .where(and(eq(alertEvents.alertRuleId, alertRuleId), eq(alertEvents.status, "firing")));
  return event ?? null;
}

export async function listAlertRulesWithStatus() {
  const rules = await db
    .select({
      id: alertRules.id,
      serviceId: alertRules.serviceId,
      serviceName: services.name,
      serviceSlug: services.slug,
      metricName: alertRules.metricName,
      comparator: alertRules.comparator,
      threshold: alertRules.threshold,
      windowMinutes: alertRules.windowMinutes,
      webhookUrl: alertRules.webhookUrl,
    })
    .from(alertRules)
    .innerJoin(services, eq(alertRules.serviceId, services.id))
    .orderBy(services.name, alertRules.metricName);

  const firingEvents = await db.select().from(alertEvents).where(eq(alertEvents.status, "firing"));
  const firingByRule = new Map(firingEvents.map((e) => [e.alertRuleId, e]));

  return rules.map((rule) => ({ ...rule, firingEvent: firingByRule.get(rule.id) ?? null }));
}

const AUDIT_LOG_PAGE_SIZE = 25;

/**
 * Cursor-paginated, not offset-paginated - an OFFSET N query re-scans and
 * discards N rows every page, which gets real on a table that (by design)
 * never stops growing. `before` is the createdAt of the last row on the
 * previous page, so each query only ever looks at rows strictly older than
 * what's already been shown.
 */
/** Capped, not truly unbounded - a CSV export of a genuinely unbounded table isn't a real feature, it's a way to OOM the process. */
const AUDIT_LOG_EXPORT_CAP = 10_000;

export async function getAuditLogForExport() {
  return db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(AUDIT_LOG_EXPORT_CAP);
}

export async function getAuditLogPage(before?: Date) {
  const rows = await db
    .select()
    .from(auditLog)
    .where(before ? lt(auditLog.createdAt, before) : undefined)
    .orderBy(desc(auditLog.createdAt))
    .limit(AUDIT_LOG_PAGE_SIZE + 1);

  const hasMore = rows.length > AUDIT_LOG_PAGE_SIZE;
  return { events: rows.slice(0, AUDIT_LOG_PAGE_SIZE), hasMore };
}
