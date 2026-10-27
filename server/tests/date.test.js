import { describe, it, expect } from "vitest";
import pg from "pg";
import "../src/config/db.js";
import { expenseSchema } from "../src/schemas.js";

describe("date handling", () => {
  it("returns Postgres DATE (OID 1082) as a YYYY-MM-DD string", () => {
    const parseDate = pg.types.getTypeParser(1082);
    expect(parseDate("2026-10-20")).toBe("2026-10-20");
  });

  it("returns boundary dates unchanged without timezone shifts", () => {
    const parseDate = pg.types.getTypeParser(1082);
    expect(parseDate("2026-12-31")).toBe("2026-12-31");
    expect(parseDate("2027-01-01")).toBe("2027-01-01");
    expect(parseDate("2026-02-28")).toBe("2026-02-28");
  });

  it("accepts YYYY-MM-DD expense_date input", () => {
    const result = expenseSchema.safeParse({
      category_id: null,
      amount: 10,
      expense_date: "2026-10-20",
    });
    expect(result.success).toBe(true);
  });

  it("rejects ISO timestamps and malformed expense_date input", () => {
    expect(
      expenseSchema.safeParse({
        category_id: null,
        amount: 10,
        expense_date: "2026-10-20T18:30:00.000Z",
      }).success
    ).toBe(false);

    expect(
      expenseSchema.safeParse({
        category_id: null,
        amount: 10,
        expense_date: "not-a-date",
      }).success
    ).toBe(false);
  });
});
