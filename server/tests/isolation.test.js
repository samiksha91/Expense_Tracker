import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { setupDatabase, resetDatabase, api, registerAndGetToken } from "./helpers.js";

beforeAll(async () => {
  await setupDatabase();
});

beforeEach(async () => {
  await resetDatabase();
});

describe("cross-user isolation", () => {
  it("prevents user B from reading, updating, or deleting user A's expenses", async () => {
    const alice = await registerAndGetToken();
    const bob = await registerAndGetToken();

    const created = await api().post("/api/expenses").set("Cookie", alice.token).send({
      category_id: null,
      amount: 50,
      description: "Alice secret",
      expense_date: "2026-10-15",
    });
    const id = created.body.data.id;

    const read = await api().get(`/api/expenses/${id}`).set("Cookie", bob.token);
    expect(read.status).toBe(404);

    const update = await api().put(`/api/expenses/${id}`).set("Cookie", bob.token).send({
      category_id: null,
      amount: 99,
      description: "hijack",
      expense_date: "2026-10-15",
    });
    expect(update.status).toBe(404);

    const del = await api().delete(`/api/expenses/${id}`).set("Cookie", bob.token);
    expect(del.status).toBe(404);

    const bobList = await api().get("/api/expenses").set("Cookie", bob.token);
    expect(bobList.body.data).toHaveLength(0);
  });

  it("prevents user B from modifying user A's categories", async () => {
    const alice = await registerAndGetToken();
    const bob = await registerAndGetToken();

    const aliceCategories = await api().get("/api/categories").set("Cookie", alice.token);
    const aliceCategory = aliceCategories.body.data[0];

    const update = await api()
      .put(`/api/categories/${aliceCategory.id}`)
      .set("Cookie", bob.token)
      .send({ name: "Hijacked" });
    expect(update.status).toBe(404);

    const del = await api().delete(`/api/categories/${aliceCategory.id}`).set("Cookie", bob.token);
    expect(del.status).toBe(404);
  });

  it("gives each user their own categories", async () => {
    const alice = await registerAndGetToken();
    const bob = await registerAndGetToken();

    const aliceCategories = await api().get("/api/categories").set("Cookie", alice.token);
    const bobCategories = await api().get("/api/categories").set("Cookie", bob.token);

    const aliceIds = aliceCategories.body.data.map((c) => c.id);
    const bobIds = bobCategories.body.data.map((c) => c.id);

    for (const id of bobIds) {
      expect(aliceIds).not.toContain(id);
    }
  });
});
