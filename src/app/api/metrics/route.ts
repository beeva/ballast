import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { checkRateLimit } from "@/lib/rate-limit";
import { ingestMetrics, ingestRequestSchema } from "@/lib/metrics/ingest";
import { isValidIngestKey } from "@/lib/metrics/auth";

/**
 * Accepts a single metric point or a batch (array) of up to 500. Doesn't
 * use the admin session cookie (a metrics agent shouldn't need to sign in
 * interactively) - instead a shared-secret Authorization header, checked
 * before rate limiting and before touching the request body, so a wrong
 * key never gets to consume rate-limit budget or trigger JSON parsing.
 */
export async function POST(request: NextRequest) {
  if (!isValidIngestKey(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Missing or invalid API key." }, { status: 401 });
  }

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
