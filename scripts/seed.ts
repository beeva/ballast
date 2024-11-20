import "dotenv/config";
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { adminUsers, alertRules, services } from "../src/lib/db/schema";
import { hashPassword } from "../src/lib/auth/password";
import { describeDatabaseTarget } from "../src/lib/db/describe-target";
import { prepareFixtureRepo } from "../src/lib/builds/prepare-fixture-repo";

const FIXTURES_ROOT = path.join(__dirname, "..", "fixtures");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env first.");

  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql);

  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@example.com").toLowerCase();
  const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? "change-me-now";

  console.log(`Seeding admin user ${adminEmail} into ${describeDatabaseTarget(url)}...`);
  await db
    .insert(adminUsers)
    .values({ email: adminEmail, passwordHash: hashPassword(adminPassword) })
    .onConflictDoNothing({ target: adminUsers.email });

  console.log("Preparing demo service fixture repos...");
  const workspaceRoot = path.resolve(process.env.BALLAST_WORKSPACE_DIR ?? "./.ballast/workspaces");
  const fixtureReposRoot = path.join(workspaceRoot, "..", "fixture-repos");

  const sampleRepoPath = path.join(fixtureReposRoot, "sample-service");
  await prepareFixtureRepo(path.join(FIXTURES_ROOT, "sample-service"), sampleRepoPath);

  const failingRepoPath = path.join(fixtureReposRoot, "failing-service");
  await prepareFixtureRepo(path.join(FIXTURES_ROOT, "failing-service"), failingRepoPath);

  const envVarRepoPath = path.join(fixtureReposRoot, "env-var-service");
  await prepareFixtureRepo(path.join(FIXTURES_ROOT, "env-var-service"), envVarRepoPath);

  console.log("Seeding demo services...");
  await db
    .insert(services)
    .values([
      {
        name: "Sample Service",
        slug: "sample-service",
        repoUrl: sampleRepoPath,
        buildCommand: "npm run build",
        startCommand: "npm start",
        cpuRequestMilli: 250,
        memoryRequestMb: 512,
      },
      {
        name: "Failing Service",
        slug: "failing-service",
        repoUrl: failingRepoPath,
        buildCommand: "npm run build",
        startCommand: "npm start",
        cpuRequestMilli: 250,
        memoryRequestMb: 256,
      },
      {
        name: "Env Var Service",
        slug: "env-var-service",
        repoUrl: envVarRepoPath,
        buildCommand: "npm run build",
        startCommand: "npm start",
        envVars: { CONFIG_TOKEN: "demo-config-token" },
        cpuRequestMilli: 250,
        memoryRequestMb: 256,
      },
    ])
    .onConflictDoNothing({ target: services.slug });

  const [sampleService] = await db.select().from(services).where(eq(services.slug, "sample-service"));
  if (sampleService) {
    const [existingRule] = await db.select().from(alertRules).where(eq(alertRules.serviceId, sampleService.id));
    if (!existingRule) {
      console.log("Seeding a demo alert rule with a webhook URL configured...");
      await db.insert(alertRules).values({
        serviceId: sampleService.id,
        metricName: "latency_ms",
        comparator: "gt",
        threshold: "500",
        windowMinutes: 5,
        webhookUrl: "https://example.com/hooks/ballast-demo",
      });
    }
  }

  console.log(`Done. Admin login: ${adminEmail} / ${adminPassword}`);
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
