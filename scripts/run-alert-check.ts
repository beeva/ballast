import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";
import { alertRules } from "@/lib/db/schema";
import { evaluateAlertRule } from "@/lib/alerts/evaluate";
import { describeDatabaseTarget } from "@/lib/db/describe-target";

const POLL_INTERVAL_MS = 30_000;

function createDbConnection() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env first.");
  }
  const sql = postgres(url, { max: 1 });
  return { db: drizzle(sql, { schema }), sql, url };
}

async function checkAllRules(db: ReturnType<typeof createDbConnection>["db"]) {
  const rules = await db.select().from(alertRules);
  for (const rule of rules) {
    const result = await evaluateAlertRule(db, rule);
    if (result.outcome === "fired" || result.outcome === "resolved") {
      const verb = result.outcome === "fired" ? "FIRING" : "resolved";
      console.log(`Alert rule ${rule.id} (${rule.metricName} ${rule.comparator} ${rule.threshold}): ${verb} at ${result.currentValue}`);
    }
  }
  return rules.length;
}

async function main() {
  const watch = process.argv.includes("--watch");
  const { db, sql, url } = createDbConnection();

  console.log(`Alert checker starting against ${describeDatabaseTarget(url)}`);

  do {
    const count = await checkAllRules(db);
    console.log(`Checked ${count} alert rule(s).`);
    if (watch) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  } while (watch);

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
