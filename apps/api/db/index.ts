import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set (postgres://user:password@host:port/database)"
  );
}

// SSL is controlled by the URL itself — append ?sslmode=no-verify for managed
// Postgres with a self-signed CA (e.g. Aiven), omit for local dev.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });
export { pool };
export * from "./schema";
