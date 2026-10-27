import { newDb } from "pg-mem";
import { readFile } from "node:fs/promises";
import request from "supertest";
import app from "../src/app.js";
import { setPool, getPool } from "../src/config/db.js";

export async function setupDatabase() {
  const mem = newDb();
  const schema = await readFile(
    new URL("../src/db/migrations/001_init.sql", import.meta.url),
    "utf8"
  );

  for (const statement of schema.split(";")) {
    const trimmed = statement.trim();
    if (!trimmed || trimmed.toUpperCase().startsWith("CREATE INDEX")) continue;
    mem.public.none(trimmed);
  }

  const { Pool } = mem.adapters.createPg();
  setPool(new Pool());
}

export async function resetDatabase() {
  const pool = getPool();
  await pool.query("DELETE FROM expenses");
  await pool.query("DELETE FROM categories");
  await pool.query("DELETE FROM users");
}

export function api() {
  return request(app);
}

let emailCounter = 0;

export function uniqueEmail(prefix = "user") {
  emailCounter += 1;
  return `${prefix}-${Date.now()}-${emailCounter}@example.com`;
}

export async function registerAndGetToken(overrides = {}) {
  const email = overrides.email || uniqueEmail();
  const res = await request(app)
    .post("/api/auth/register")
    .send({
      name: overrides.name || "Test User",
      email,
      password: overrides.password || "password123",
    });

  const token = res.headers["set-cookie"]?.[0]?.split(";")[0];
  return { res, token, email };
}
