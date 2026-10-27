import * as expenseModel from "../models/expense.js";

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function getSummary(req, res) {
  const month = req.query.month || currentMonthKey();
  const summary = await expenseModel.getSummary(req.user.id, month);
  return res.json({ data: summary });
}
