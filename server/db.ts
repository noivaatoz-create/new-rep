import dns from "dns";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../shared/schema.js";

// Force IPv4 to avoid ECONNREFUSED on IPv6 addresses
dns.setDefaultResultOrder("ipv4first");

// Prefer NEON_DATABASE_URL on Vercel so Vercel Postgres (or other integration) doesn't override
const connectionString = (process.env.NEON_DATABASE_URL || process.env.DATABASE_URL)?.trim();
if (!connectionString) {
  throw new Error("DATABASE_URL or NEON_DATABASE_URL must be set. Did you forget to provision a database?");
}
// Catch wrong host (e.g. old "base" or placeholder) before connect
try {
  const u = new URL(connectionString);
  if (!u.hostname || u.hostname === "base" || (process.env.VERCEL && /^localhost$/i.test(u.hostname))) {
    throw new Error(`DATABASE_URL has invalid host "${u.hostname}". On Vercel, use your full Neon URL (host like ep-xxx.aws.neon.tech).`);
  }
} catch (e) {
  if (e instanceof Error && e.message.startsWith("DATABASE_URL")) throw e;
  // URL parse failed (e.g. no protocol) - let pg throw later
}

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  query_timeout: 15000,
  max: 3,
});

export const db = drizzle(pool, { schema });
