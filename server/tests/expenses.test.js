import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { setupDatabase, resetDatabase, api, registerAndGetToken } from "./helpers.js";

beforeAll(async () => {
  await setupDatabase();
});

beforeEach(async () => {
  await resetDatabase();
});

async function createExpense(token, overrides = {}) {
  return api().post("/api/expenses").set("Cookie", token).send({
    category_id: null,
    amount: 25,
    description: "Sample",
    expense_date: "2026-10-15",
    ...overrides,
  });
}

describe("expenses", () => {
  it("creates, reads, updates, and deletes an expense", async () => {
    const { token } = await registerAndGetToken();

    const created = await createExpense(token);
    expect(created.status).toBe(201);

    const id = created.body.data.id;
    const got = await api().get(`/api/expenses/${id}`).set("Cookie", token);
    expect(got.status).toBe(200);

    const updated = await api().put(`/api/expenses/${id}`).set("Cookie", token).send({
      category_id: null,
      amount: 30,
      description: "Updated",
      expense_date: "2026-10-15",
    });
    expect(updated.status).toBe(200);
    expect(Number(updated.body.data.amount)).toBe(30);

    const deleted = await api().delete(`/api/expenses/${id}`).set("Cookie", token);
    expect(deleted.status).toBe(200);

    const after = await api().get(`/api/expenses/${id}`).set("Cookie", token);
    expect(after.status).toBe(404);
  });

  it("validates expense input", async () => {
    const { token } = await registerAndGetToken();

    const badAmount = await createExpense(token, { amount: 0 });
    expect(badAmount.status).toBe(400);

    const badDate = await createExpense(token, { expense_date: "not-a-date" });
    expect(badDate.status).toBe(400);
  });

  it("filters by category, date range, and search", async () => {
    const { token } = await registerAndGetToken();
    const cats = await api().get("/api/categories").set("Cookie", token);
    const food = cats.body.data.find((c) => c.name === "Food");

    await createExpense(token, { category_id: food.id, amount: 10, description: "Lunch", expense_date: "2026-10-01" });
    await createExpense(token, { category_id: null, amount: 20, description: "Coffee", expense_date: "2026-10-20" });

    const byCategory = await api().get(`/api/expenses?category_id=${food.id}`).set("Cookie", token);
    expect(byCategory.body.data).toHaveLength(1);
    expect(byCategory.body.data[0].description).toBe("Lunch");

    const byRange = await api()
      .get("/api/expenses?startDate=2026-10-01&endDate=2026-10-10")
      .set("Cookie", token);
    expect(byRange.body.data).toHaveLength(1);

    const bySearch = await api().get("/api/expenses?search=coffee").set("Cookie", token);
    expect(bySearch.body.data).toHaveLength(1);
    expect(bySearch.body.data[0].description).toBe("Coffee");
  });

  it("rejects a category that belongs to another user", async () => {
    const alice = await registerAndGetToken();
    const bob = await registerAndGetToken();

    const bobCategories = await api().get("/api/categories").set("Cookie", bob.token);
    const bobCategory = bobCategories.body.data[0];

    const res = await createExpense(alice.token, { category_id: bobCategory.id });
    expect(res.status).toBe(400);
  });
});
