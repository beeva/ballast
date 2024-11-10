import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "./session";

/** Reads and verifies the admin session from the request cookie. Null if signed out. */
export async function getCurrentAdmin(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE.name)?.value;
  return token ? verifySession(token) : null;
}

/**
 * Same as getCurrentAdmin, but throws if there's no valid session. Server
 * actions are invokable by their own encrypted action id regardless of
 * which page's request path it arrives on, so middleware's path-based
 * `/admin` matcher doesn't reliably gate them the way it gates page
 * navigation - every admin mutation calls this itself rather than relying
 * on middleware alone.
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not signed in.");
  return admin;
}
