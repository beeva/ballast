import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";
import { countMetricsOlderThan, pruneMetricsOlderThan } from "@/lib/metrics/prune";
import { describeDatabaseTarget } from "@/lib/db/describe-target";

const DEFAULT_RETENTION_DAYS = 30;

function parseDays(): number {
  const arg = process.argv.find((a) => a.startsWith("--days="));
  if (!arg) return DEFAULT_RETENTION_DAYS;
  const value = Number(arg.slice("--days=".length));
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`--days must be a positive number, got "${arg.slice("--days=".length)}"`);
  }
  return value;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env first.");

  const days = parseDays();
  const dryRun = process.argv.includes("--dry-run");
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql, { schema });

  console.log(`Pruning metrics older than ${days}d (before ${cutoff.toISOString()}) from ${describeDatabaseTarget(url)}${dryRun ? " [dry run]" : ""}`);

  if (dryRun) {
    const count = await countMetricsOlderThan(db, cutoff);
    console.log(`Would delete ${count} metric point(s). Re-run without --dry-run to actually delete.`);
  } else {
    const result = await pruneMetricsOlderThan(db, cutoff);
    console.log(`Deleted ${result.deletedCount} metric point(s).`);
  }

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
