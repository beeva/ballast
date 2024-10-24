import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  var __ballastSql: postgres.Sql | undefined;
}

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and point it at a running Postgres instance (see docker-compose.yml)."
    );
  }
  return postgres(url, { max: 10, onnotice: () => {} });
}

// Reuse the connection across hot reloads in dev instead of leaking sockets.
const sql = globalThis.__ballastSql ?? createClient();
if (process.env.NODE_ENV !== "production") {
  globalThis.__ballastSql = sql;
}

export const db = drizzle(sql, { schema });
export { sql };
