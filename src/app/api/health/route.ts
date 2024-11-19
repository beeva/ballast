import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";

export const dynamic = "force-dynamic";

/**
 * A real liveness/readiness check, not a static 200 - actually round-trips
 * to Postgres, so a load balancer or orchestrator pointed at this catches
 * "the app process is up but its database is unreachable" instead of
 * reporting healthy while every real request would fail.
 */
export async function GET() {
  try {
    await sql`select 1`;
    return NextResponse.json({ status: "ok", database: "ok" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "error", database: "unreachable" }, { status: 503 });
  }
}
