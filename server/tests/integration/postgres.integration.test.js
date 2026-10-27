import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFile } from "node:fs/promises";
import request from "supertest";
import pg from "pg";
import app from "../../src/app.js";
import { setPool } from "../../src/config/db.js";

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

async function ensureSchema(pool) {
  const { rows } = await pool.query("SELECT to_regclass('public.users') AS users");
  if (rows[0].users) return;

  const schema = await readFile(
    new URL("../../src/db/migrations/001_init.sql", import.meta.url),
    "utf8"
  );

  for (const statement of schema.split(";").map((s) => s.trim()).filter(Boolean)) {
    await pool.query(statement);
  }
}

describe.skipIf(!TEST_DATABASE_URL)("postgres integration", () => {
  let pool;
  const createdEmails = [];

  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: TEST_DATABASE_URL, max: 5 });
    await ensureSchema(pool);
    setPool(pool);
  });

  afterAll(async () => {
    if (pool) {
      for (const email of createdEmails) {
        await pool.query("DELETE FROM users WHERE email = $1", [email]);
      }
      await pool.end();
    }
  });

  async function registerUser(prefix) {
    const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    createdEmails.push(email);

    const res = await request(app).post("/api/auth/register").send({
      name: prefix,
      email,
      password: "password123",
    });

    const cookie = res.headers["set-cookie"]?.[0]?.split(";")[0];
    return { res, email, cookie };
  }

  it("round-trips an expense and returns expense_date as YYYY-MM-DD", async () => {
    const { cookie } = await registerUser("pg-crud");

    const created = await request(app).post("/api/expenses").set("Cookie", cookie).send({
      category_id: null,
      amount: 12.34,
      description: "integration date",
      expense_date: "2026-10-20",
    });
    expect(created.status).toBe(201);
    expect(created.body.data.expense_date).toBe("2026-10-20");

    const got = await request(app).get(`/api/expenses/${created.body.data.id}`).set("Cookie", cookie);
    expect(got.status).toBe(200);
    expect(got.body.data.expense_date).toBe("2026-10-20");
    expect(Number(got.body.data.amount)).toBe(12.34);

    const updated = await request(app)
      .put(`/api/expenses/${created.body.data.id}`)
      .set("Cookie", cookie)
      .send({
        category_id: null,
        amount: 23.45,
        description: "integration updated",
        expense_date: "2026-10-21",
      });
    expect(updated.status).toBe(200);
    expect(updated.body.data.expense_date).toBe("2026-10-21");
    expect(Number(updated.body.data.amount)).toBe(23.45);
  });

  it("enforces per-user isolation on the real database", async () => {
    const alice = await registerUser("pg-iso-a");
    const bob = await registerUser("pg-iso-b");

    const created = await request(app).post("/api/expenses").set("Cookie", alice.cookie).send({
      category_id: null,
      amount: 50,
      description: "Alice only",
      expense_date: "2026-10-21",
    });
    const id = created.body.data.id;

    const read = await request(app).get(`/api/expenses/${id}`).set("Cookie", bob.cookie);
    expect(read.status).toBe(404);

    const update = await request(app).put(`/api/expenses/${id}`).set("Cookie", bob.cookie).send({
      category_id: null,
      amount: 99,
      description: "hijack",
      expense_date: "2026-10-21",
    });
    expect(update.status).toBe(404);

    const del = await request(app).delete(`/api/expenses/${id}`).set("Cookie", bob.cookie);
    expect(del.status).toBe(404);
  });
});
