import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { setupDatabase, resetDatabase, api, registerAndGetToken } from "./helpers.js";

beforeAll(async () => {
  await setupDatabase();
});

beforeEach(async () => {
  await resetDatabase();
});

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function previousMonthKey() {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

describe("summary calculations", () => {
  it("sums current-month expenses and groups them by category", async () => {
    const { token } = await registerAndGetToken();
    const cats = await api().get("/api/categories").set("Cookie", token);
    const food = cats.body.data.find((c) => c.name === "Food");
    const transport = cats.body.data.find((c) => c.name === "Transport");

    const currentMonth = currentMonthKey();
    const previousMonth = previousMonthKey();

    await api().post("/api/expenses").set("Cookie", token).send({
      category_id: food.id,
      amount: 40,
      description: "Lunch",
      expense_date: `${currentMonth}-01`,
    });
    await api().post("/api/expenses").set("Cookie", token).send({
      category_id: food.id,
      amount: 60,
      description: "Dinner",
      expense_date: `${currentMonth}-15`,
    });
    await api().post("/api/expenses").set("Cookie", token).send({
      category_id: transport.id,
      amount: 30,
      description: "Bus",
      expense_date: `${currentMonth}-10`,
    });
    await api().post("/api/expenses").set("Cookie", token).send({
      category_id: food.id,
      amount: 999,
      description: "Old expense",
      expense_date: `${previousMonth}-10`,
    });

    const res = await api().get(`/api/stats/summary?month=${currentMonth}`).set("Cookie", token);
    expect(res.status).toBe(200);

    const summary = res.body.data;
    expect(summary.total).toBe(130);
    expect(summary.count).toBe(3);

    const foodRow = summary.byCategory.find((row) => row.categoryId === food.id);
    const transportRow = summary.byCategory.find((row) => row.categoryId === transport.id);
    expect(foodRow.total).toBe(100);
    expect(transportRow.total).toBe(30);
  });

  it("does not include another user's expenses in the summary", async () => {
    const alice = await registerAndGetToken();
    const bob = await registerAndGetToken();
    const month = currentMonthKey();

    await api().post("/api/expenses").set("Cookie", alice.token).send({
      category_id: null,
      amount: 77,
      description: "Alice only",
      expense_date: `${month}-05`,
    });

    const bobSummary = await api().get(`/api/stats/summary?month=${month}`).set("Cookie", bob.token);
    expect(bobSummary.body.data.total).toBe(0);
  });
});
