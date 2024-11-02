import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "./client";
import { adminUsers, alertEvents, builds, services } from "./schema";
import { estimateFleetMonthlyCost } from "@/lib/cost/estimate";

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
