import "dotenv/config";
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";
import { processNextQueuedBuild } from "@/lib/builds/process-build";
import { describeDatabaseTarget } from "@/lib/db/describe-target";

const POLL_INTERVAL_MS = 3000;
const IDLE_LOG_EVERY = 20; // avoid spamming "nothing to do" every 3s while watching

function createDbConnection() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env first.");
  }
  const sql = postgres(url, { max: 1 });
  return { db: drizzle(sql, { schema }), sql, url };
}

async function main() {
  const watch = process.argv.includes("--watch");
  const workspaceRoot = path.resolve(process.env.BALLAST_WORKSPACE_DIR ?? "./.ballast/workspaces");
  const { db, sql, url } = createDbConnection();

  console.log(`Worker starting against ${describeDatabaseTarget(url)}, workspace root ${workspaceRoot}`);

  let idleTicks = 0;
  for (;;) {
    const result = await processNextQueuedBuild(db, workspaceRoot);
    if (result.processed) {
      idleTicks = 0;
      const outcome = result.success ? "succeeded" : "FAILED";
      const timing = result.durationMs === undefined ? "" : ` in ${result.durationMs}ms`;
      console.log(`Build ${result.buildId} (${result.serviceSlug}) ${outcome}${timing}`);
    } else if (!watch) {
      console.log("No queued builds.");
      break;
    } else {
      idleTicks++;
      if (idleTicks % IDLE_LOG_EVERY === 0) {
        console.log("Still watching for queued builds...");
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
