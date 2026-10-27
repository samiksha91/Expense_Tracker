import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { setupDatabase, resetDatabase, api, registerAndGetToken } from "./helpers.js";

beforeAll(async () => {
  await setupDatabase();
});

beforeEach(async () => {
  await resetDatabase();
});

describe("categories", () => {
  it("creates default categories on registration", async () => {
    const { token } = await registerAndGetToken();
    const res = await api().get("/api/categories").set("Cookie", token);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(8);
  });

  it("creates, updates, and deletes a category", async () => {
    const { token } = await registerAndGetToken();

    const created = await api().post("/api/categories").set("Cookie", token).send({ name: "Travel" });
    expect(created.status).toBe(201);

    const id = created.body.data.id;
    const updated = await api().put(`/api/categories/${id}`).set("Cookie", token).send({ name: "Trips" });
    expect(updated.status).toBe(200);
    expect(updated.body.data.name).toBe("Trips");

    const deleted = await api().delete(`/api/categories/${id}`).set("Cookie", token);
    expect(deleted.status).toBe(200);

    const list = await api().get("/api/categories").set("Cookie", token);
    expect(list.body.data.find((c) => c.id === id)).toBeUndefined();
  });

  it("rejects duplicate category names case-insensitively", async () => {
    const { token } = await registerAndGetToken();
    await api().post("/api/categories").set("Cookie", token).send({ name: "Travel" });

    const res = await api().post("/api/categories").set("Cookie", token).send({ name: "travel" });
    expect(res.status).toBe(409);
  });

  it("sets expenses to uncategorized when a category is deleted", async () => {
    const { token } = await registerAndGetToken();
    const cats = await api().get("/api/categories").set("Cookie", token);
    const food = cats.body.data.find((c) => c.name === "Food");

    const expense = await api().post("/api/expenses").set("Cookie", token).send({
      category_id: food.id,
      amount: 12.5,
      description: "Lunch",
      expense_date: "2026-10-15",
    });
    expect(expense.status).toBe(201);

    await api().delete(`/api/categories/${food.id}`).set("Cookie", token);

    const got = await api().get(`/api/expenses/${expense.body.data.id}`).set("Cookie", token);
    expect(got.body.data.category_id).toBeNull();
  });

  it("returns 404 when deleting a missing category", async () => {
    const { token } = await registerAndGetToken();
    const res = await api().delete("/api/categories/99999").set("Cookie", token);
    expect(res.status).toBe(404);
  });
});
