"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { alertRules } from "@/lib/db/schema";
import { isComparator } from "@/lib/alerts/threshold";
import { requireAdmin } from "@/lib/auth/current-admin";

const createAlertRuleSchema = z.object({
  serviceId: z.string().uuid(),
  metricName: z.string().min(1).max(80),
  comparator: z.string().refine(isComparator, { message: "Comparator must be one of gt, gte, lt, lte." }),
  threshold: z.coerce.number().finite(),
  windowMinutes: z.coerce.number().int().min(1).max(1440),
});

export interface ActionState {
  error?: string;
}

export async function createAlertRule(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = createAlertRuleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await db.insert(alertRules).values({
    serviceId: parsed.data.serviceId,
    metricName: parsed.data.metricName,
    comparator: parsed.data.comparator,
    threshold: String(parsed.data.threshold),
    windowMinutes: parsed.data.windowMinutes,
  });

  revalidatePath("/admin/alerts");
  return {};
}
