import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import bcrypt from "bcrypt";
import { setupDatabase, resetDatabase, api, registerAndGetToken, uniqueEmail } from "./helpers.js";
import { getPool } from "../src/config/db.js";

beforeAll(async () => {
  await setupDatabase();
});

beforeEach(async () => {
  await resetDatabase();
});

describe("auth", () => {
  it("registers a user, sets a cookie, and hashes the password", async () => {
    const email = uniqueEmail();
    const res = await api().post("/api/auth/register").send({
      name: "Alice",
      email,
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe(email);
    expect(res.headers["set-cookie"]).toBeDefined();

    const { rows } = await getPool().query(
      "SELECT password_hash FROM users WHERE email = $1",
      [email]
    );
    expect(rows[0].password_hash).not.toBe("password123");
    expect(await bcrypt.compare("password123", rows[0].password_hash)).toBe(true);
  });

  it("rejects duplicate email registration", async () => {
    const email = uniqueEmail();
    await api().post("/api/auth/register").send({ name: "Alice", email, password: "password123" });

    const res = await api().post("/api/auth/register").send({
      name: "Alice",
      email,
      password: "password123",
    });
    expect(res.status).toBe(409);
  });

  it("validates registration input", async () => {
    const res = await api().post("/api/auth/register").send({
      name: "",
      email: "not-an-email",
      password: "short",
    });
    expect(res.status).toBe(400);
  });

  it("logs in with valid credentials and rejects a wrong password", async () => {
    const { email } = await registerAndGetToken();

    const bad = await api().post("/api/auth/login").send({ email, password: "wrongpassword" });
    expect(bad.status).toBe(401);

    const good = await api().post("/api/auth/login").send({ email, password: "password123" });
    expect(good.status).toBe(200);
  });

  it("returns the current user and updates the display name", async () => {
    const { token } = await registerAndGetToken();

    const me = await api().get("/api/auth/me").set("Cookie", token);
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBeDefined();

    const update = await api().put("/api/auth/me").set("Cookie", token).send({ name: "New Name" });
    expect(update.status).toBe(200);
    expect(update.body.data.name).toBe("New Name");
  });

  it("changes the password and rejects an incorrect current password", async () => {
    const { token, email } = await registerAndGetToken();

    const wrong = await api().put("/api/auth/password").set("Cookie", token).send({
      currentPassword: "not-the-password",
      newPassword: "newpassword123",
    });
    expect(wrong.status).toBe(400);

    const change = await api().put("/api/auth/password").set("Cookie", token).send({
      currentPassword: "password123",
      newPassword: "newpassword123",
    });
    expect(change.status).toBe(200);

    const oldLogin = await api().post("/api/auth/login").send({ email, password: "password123" });
    expect(oldLogin.status).toBe(401);

    const newLogin = await api().post("/api/auth/login").send({ email, password: "newpassword123" });
    expect(newLogin.status).toBe(200);
  });

  it("clears the auth cookie on logout", async () => {
    const { token } = await registerAndGetToken();

    const res = await api().post("/api/auth/logout").set("Cookie", token);
    expect(res.status).toBe(200);

    const setCookie = res.headers["set-cookie"];
    expect(setCookie).toBeDefined();
    expect(setCookie.join(";")).toMatch(/token=;/);
  });
});
