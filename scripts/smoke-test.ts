/**
 * Exercises the entire real pipeline in one run: clone+build, deploy,
 * ingest a metric, evaluate an alert rule against it, and (if it fires)
 * deliver a real webhook - against whatever DATABASE_URL points at, with
 * no mocks anywhere. Every piece here is independently unit-tested
 * already; this proves they still fit together end to end, the same way
 * this project's development process has verified each feature live
 * throughout, just formalized into one repeatable script instead of a
 * throwaway one written by hand each time.
 *
 * Creates its own throwaway service (and cleans it up in a finally block,
 * success or failure) rather than touching seeded data, so it's safe to
 * run against a database that already has real services in it.
 */
import "dotenv/config";
import http from "node:http";
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { services, builds, alertRules } from "@/lib/db/schema";
import { prepareFixtureRepo } from "@/lib/builds/prepare-fixture-repo";
import { processNextQueuedBuild } from "@/lib/builds/process-build";
import { deployBuild } from "@/lib/deploys/deploy";
import { ingestMetrics } from "@/lib/metrics/ingest";
import { evaluateAlertRule } from "@/lib/alerts/evaluate";
import { describeDatabaseTarget } from "@/lib/db/describe-target";

function log(step: string, ok: boolean, detail?: string) {
  console.log(`${ok ? "✓" : "✗"} ${step}${detail ? ` - ${detail}` : ""}`);
  if (!ok) throw new Error(`Smoke test failed at: ${step}`);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env first.");

  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql, { schema });
  console.log(`Smoke test starting against ${describeDatabaseTarget(url)}\n`);

  // Real local HTTP server standing in for a webhook receiver - proves the
  // whole chain by actually receiving a POST, not by trusting a mocked fetch.
  let webhookReceived: string | null = null;
  const webhookServer = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      webhookReceived = Buffer.concat(chunks).toString("utf8");
      res.writeHead(200);
      res.end("{}");
    });
  });
  await new Promise<void>((resolve) => webhookServer.listen(0, "127.0.0.1", resolve));
  const address = webhookServer.address();
  if (typeof address !== "object" || address === null) throw new Error("no webhook server address");
  const webhookUrl = `http://127.0.0.1:${address.port}/hook`;

  const slug = `smoke-test-${Date.now()}`;
  let serviceId: string | undefined;

  try {
    const repoPath = path.join(process.cwd(), ".ballast", "fixture-repos", slug);
    await prepareFixtureRepo(path.join(process.cwd(), "fixtures", "sample-service"), repoPath);
    log("prepared a real local git repo for the test service", true);

    const [service] = await db
      .insert(services)
      .values({
        name: "Smoke Test Service",
        slug,
        repoUrl: repoPath,
        buildCommand: "npm run build",
        startCommand: "npm start",
      })
      .returning();
    if (!service) throw new Error("service insert returned no row");
    serviceId = service.id;
    log("created a real service row", true, service.id);

    await db.insert(builds).values({ serviceId: service.id, status: "queued" });
    const buildResult = await processNextQueuedBuild(db, process.env.BALLAST_WORKSPACE_DIR ?? "./.ballast/workspaces");
    log("worker claimed and ran a real build", buildResult.processed && buildResult.success === true);
    if (!buildResult.processed) throw new Error("unreachable");

    const deployResult = await deployBuild(db, {
      serviceId: service.id,
      buildId: buildResult.buildId,
      deployedBy: "smoke-test",
    });
    log("deployed the real build", deployResult.ok, deployResult.ok ? deployResult.deployId : deployResult.error);

    const ingestResult = await ingestMetrics(db, { serviceSlug: slug, metricName: "latency_ms", value: 900 });
    log("ingested a real metric point", ingestResult.ok);

    const [rule] = await db
      .insert(alertRules)
      .values({
        serviceId: service.id,
        metricName: "latency_ms",
        comparator: "gt",
        threshold: "500",
        windowMinutes: 5,
        webhookUrl,
      })
      .returning();
    if (!rule) throw new Error("alert rule insert returned no row");
    const evalResult = await evaluateAlertRule(db, rule);
    log("alert rule evaluated against the real ingested point", evalResult.outcome === "fired", `outcome=${evalResult.outcome}`);

    await new Promise((r) => setTimeout(r, 300));
    log("webhook receiver actually got a POST", webhookReceived !== null && JSON.parse(webhookReceived).event === "fired");

    console.log("\nAll real, all connected: clone → build → deploy → ingest → alert → webhook.");
  } finally {
    // Delete just the service - builds/deploys/metrics/alert_rules/
    // alert_events all cascade from it (see schema.ts). Deleting the
    // child tables by hand first, in the wrong order, is exactly what
    // this script's first real run got wrong: builds before deploys trips
    // deploys.buildId's ON DELETE RESTRICT, since the deploy row is still
    // there pointing at the build you're trying to remove.
    if (serviceId) {
      await db.delete(services).where(eq(services.id, serviceId));
    }
    webhookServer.close();
    await sql.end();
  }
}

main().catch((err) => {
  console.error("\n" + (err instanceof Error ? err.message : String(err)));
  process.exitCode = 1;
});
