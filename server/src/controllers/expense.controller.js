import * as expenseModel from "../models/expense.js";
import * as categoryModel from "../models/category.js";

async function ensureCategoryBelongsToUser(categoryId, userId) {
  if (categoryId === null || categoryId === undefined) return true;
  const category = await categoryModel.findCategoryById(categoryId, userId);
  return Boolean(category);
}

export async function listExpenses(req, res) {
  const filters = {
    categoryId: req.query.category_id ? Number(req.query.category_id) : undefined,
    startDate: req.query.startDate || undefined,
    endDate: req.query.endDate || undefined,
    search: req.query.search || undefined,
  };

  const expenses = await expenseModel.listExpenses(req.user.id, filters);
  return res.json({ data: expenses });
}

export async function createExpense(req, res) {
  const { category_id, amount, description, expense_date } = req.validated;

  if (!(await ensureCategoryBelongsToUser(category_id, req.user.id))) {
    return res.status(400).json({ error: "Category does not exist" });
  }

  const expense = await expenseModel.createExpense(req.user.id, {
    categoryId: category_id ?? null,
    amount,
    description: description || null,
    expenseDate: expense_date,
  });

  return res.status(201).json({ data: expense });
}

export async function getExpense(req, res) {
  const id = Number(req.params.id);
  const expense = await expenseModel.findExpenseById(id, req.user.id);

  if (!expense) {
    return res.status(404).json({ error: "Expense not found" });
  }

  return res.json({ data: expense });
}

export async function updateExpense(req, res) {
  const id = Number(req.params.id);
  const { category_id, amount, description, expense_date } = req.validated;

  if (!(await ensureCategoryBelongsToUser(category_id, req.user.id))) {
    return res.status(400).json({ error: "Category does not exist" });
  }

  const expense = await expenseModel.updateExpense(id, req.user.id, {
    categoryId: category_id ?? null,
    amount,
    description: description || null,
    expenseDate: expense_date,
  });

  if (!expense) {
    return res.status(404).json({ error: "Expense not found" });
  }

  return res.json({ data: expense });
}

export async function deleteExpense(req, res) {
  const id = Number(req.params.id);
  const expense = await expenseModel.deleteExpense(id, req.user.id);

  if (!expense) {
    return res.status(404).json({ error: "Expense not found" });
  }

  return res.json({ data: null });
}
