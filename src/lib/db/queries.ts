import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "./client";
import { adminUsers, alertEvents, alertRules, builds, deploys, services } from "./schema";
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
