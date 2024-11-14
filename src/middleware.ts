import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE.name)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Two patterns, not one: "/admin/(...)" alone requires a trailing slash
  // plus at least one more path segment, so it silently excludes the bare
  // "/admin" route itself. The lookahead is anchored to a full path segment
  // (login(?:/|$)), not just a string prefix - "(?!login)" alone would also
  // exclude any future route whose slug merely *starts with* "login" (e.g.
  // "/admin/login-history"), leaving it completely unmatched by either
  // pattern and so unprotected by this middleware.
  matcher: ["/admin", "/admin/((?!login(?:/|$)).*)"],
};
