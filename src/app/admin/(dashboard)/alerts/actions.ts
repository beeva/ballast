"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { alertRules } from "@/lib/db/schema";
import { isComparator } from "@/lib/alerts/threshold";
import { sendAlertWebhook } from "@/lib/alerts/webhook";
import { requireAdmin } from "@/lib/auth/current-admin";
import { recordAuditEvent } from "@/lib/audit/record";

const createAlertRuleSchema = z.object({
  serviceId: z.string().uuid(),
  metricName: z.string().min(1).max(80),
  comparator: z.string().refine(isComparator, { message: "Comparator must be one of gt, gte, lt, lte." }),
  threshold: z.coerce.number().finite(),
  windowMinutes: z.coerce.number().int().min(1).max(1440),
  webhookUrl: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : null))
    .refine((v) => v === null || /^https?:\/\//.test(v), {
      message: "Webhook URL must start with http:// or https://.",
    }),
});

export interface ActionState {
  error?: string;
}

export async function createAlertRule(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = createAlertRuleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const [created] = await db
    .insert(alertRules)
    .values({
      serviceId: parsed.data.serviceId,
      metricName: parsed.data.metricName,
      comparator: parsed.data.comparator,
      threshold: String(parsed.data.threshold),
      windowMinutes: parsed.data.windowMinutes,
      webhookUrl: parsed.data.webhookUrl,
    })
    .returning({ id: alertRules.id });

  await recordAuditEvent(db, {
    actorEmail: admin.email,
    action: "alert_rule.created",
    targetType: "alert_rule",
    targetId: created?.id,
    detail: parsed.data.metricName,
  });

  revalidatePath("/admin/alerts");
  return {};
}

/**
 * Bound to a plain `<form action={...}>` per rule row, so - like
 * deployBuildAction - it returns void and throws on failure rather than an
 * ActionState. Deleting a rule cascades to its alertEvents (including any
 * currently-firing one), which is the schema's declared behavior, not a
 * special case handled here.
 */
export async function deleteAlertRule(ruleId: string): Promise<void> {
  const admin = await requireAdmin();
  const [deleted] = await db
    .delete(alertRules)
    .where(eq(alertRules.id, ruleId))
    .returning({ metricName: alertRules.metricName });

  await recordAuditEvent(db, {
    actorEmail: admin.email,
    action: "alert_rule.deleted",
    targetType: "alert_rule",
    targetId: ruleId,
    detail: deleted?.metricName,
  });

  revalidatePath("/admin/alerts");
}

export interface TestWebhookState {
  result?: "success" | "error";
  message?: string;
}

/**
 * Sends a real POST to the rule's configured webhookUrl with event: "test",
 * so an admin can confirm a receiver is actually reachable before relying
 * on it to fire during a real incident - not a dry-run, the same
 * sendAlertWebhook the fire/resolve path uses, just with a result the
 * caller can see instead of fire-and-forget.
 */
export async function testAlertWebhook(ruleId: string, _prevState: TestWebhookState): Promise<TestWebhookState> {
  await requireAdmin();

  const [rule] = await db.select().from(alertRules).where(eq(alertRules.id, ruleId));
  if (!rule) return { result: "error", message: "Rule not found." };
  if (!rule.webhookUrl) return { result: "error", message: "No webhook URL configured for this rule." };

  const result = await sendAlertWebhook(rule.webhookUrl, {
    event: "test",
    ruleId: rule.id,
    serviceId: rule.serviceId,
    metricName: rule.metricName,
    comparator: rule.comparator,
    threshold: Number(rule.threshold),
    currentValue: Number(rule.threshold),
    occurredAt: new Date().toISOString(),
  });

  return result.ok
    ? { result: "success", message: "Webhook responded successfully." }
    : { result: "error", message: result.error };
}
