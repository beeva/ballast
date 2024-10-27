import "server-only";
import { eq } from "drizzle-orm";
import { db } from "./client";
import { adminUsers } from "./schema";

export async function getAdminByEmail(email: string) {
  const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.email, email.toLowerCase()));
  return admin ?? null;
}
