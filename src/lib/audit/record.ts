import type { db as DbClient } from "@/lib/db/client";
import { auditLog } from "@/lib/db/schema";

export type Db = typeof DbClient;

export type AuditTargetType = "service" | "build" | "deploy" | "alert_rule" | "admin";

export interface AuditEventInput {
  actorEmail: string;
  action: string;
  targetType: AuditTargetType;
  targetId?: string;
  detail?: string;
}

/** Writes one audit_log row. Call this from every admin mutation, after it succeeds. */
export async function recordAuditEvent(db: Db, input: AuditEventInput): Promise<void> {
  await db.insert(auditLog).values({
    actorEmail: input.actorEmail,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId ?? null,
    detail: input.detail ?? null,
  });
}
