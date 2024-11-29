"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { adminUsers } from "@/lib/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { requireAdmin } from "@/lib/auth/current-admin";
import { recordAuditEvent } from "@/lib/audit/record";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation don't match.",
    path: ["confirmPassword"],
  });

export interface ChangePasswordState {
  error?: string;
  success?: boolean;
}

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const admin = await requireAdmin();

  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const [adminRow] = await db.select().from(adminUsers).where(eq(adminUsers.id, admin.adminId));
  // Same shape of check as login: verify against a real hash, only ever
  // the signed-in admin's own row - there's no "change someone else's
  // password" path here, current session identifies whose row this is.
  if (!adminRow || !verifyPassword(parsed.data.currentPassword, adminRow.passwordHash)) {
    return { error: "Current password is incorrect." };
  }

  await db
    .update(adminUsers)
    .set({ passwordHash: hashPassword(parsed.data.newPassword) })
    .where(eq(adminUsers.id, admin.adminId));

  await recordAuditEvent(db, {
    actorEmail: admin.email,
    action: "admin.password_changed",
    targetType: "admin",
    targetId: admin.adminId,
  });

  revalidatePath("/admin/account");
  return { success: true };
}
