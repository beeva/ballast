"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminByEmail } from "@/lib/db/queries";
import { verifyPassword } from "@/lib/auth/password";
import { signSession, SESSION_COOKIE } from "@/lib/auth/session";
import { safeRedirectTarget } from "@/lib/auth/safe-redirect";
import { checkRateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export interface LoginState {
  error?: string;
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }
  const { email, password } = parsed.data;

  const rateLimit = checkRateLimit(`login:${email.toLowerCase()}`, { limit: 5, windowMs: 5 * 60_000 });
  if (!rateLimit.allowed) {
    return { error: "Too many attempts. Wait a few minutes and try again." };
  }

  const admin = await getAdminByEmail(email);
  // Always run the (constant-time) password check against something, even
  // for an unknown email, so response timing doesn't reveal which admin
  // accounts exist.
  const DUMMY_HASH = `${"0".repeat(32)}:${"0".repeat(128)}`;
  const isValid = verifyPassword(password, admin?.passwordHash ?? DUMMY_HASH);

  if (!admin || !isValid) {
    return { error: "Incorrect email or password." };
  }

  const token = await signSession({ adminId: admin.id, email: admin.email });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE.name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE.maxAge,
  });

  redirect(safeRedirectTarget(formData.get("from") as string | null));
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE.name);
  redirect("/admin/login");
}
