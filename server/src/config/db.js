import pg from "pg";
import { env } from "./env.js";

const { Pool, types } = pg;

// Return Postgres DATE columns as 'YYYY-MM-DD' strings instead of Date objects.
types.setTypeParser(1082, (value) => value);

let currentPool = null;

export function setPool(pool) {
  currentPool = pool;
}

export function getPool() {
  if (!currentPool) {
    currentPool = new Pool({
      connectionString: env.DATABASE_URL || undefined,
      max: 10,
    });
  }
  return currentPool;
}
