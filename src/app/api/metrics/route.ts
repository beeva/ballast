import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { checkRateLimit } from "@/lib/rate-limit";
import { ingestMetrics, ingestRequestSchema } from "@/lib/metrics/ingest";

/**
 * Accepts a single metric point or a batch (array) of up to 500. Rate
 * limited per client IP - this is an unauthenticated ingestion endpoint by
 * design (a metrics agent shouldn't need a session), so it's the one thing
 * standing between it and being trivially hammered.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimit = checkRateLimit(`metrics-ingest:${ip}`, { limit: 120, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = ingestRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid metric point(s).", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await ingestMetrics(db, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ inserted: result.inserted }, { status: 201 });
}
