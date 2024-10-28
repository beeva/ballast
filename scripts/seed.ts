import "dotenv/config";
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { adminUsers, services } from "../src/lib/db/schema";
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
    ])
    .onConflictDoNothing({ target: services.slug });

  console.log(`Done. Admin login: ${adminEmail} / ${adminPassword}`);
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
