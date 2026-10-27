import { getPool } from "../config/db.js";

function formatDateOnly(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthRange(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(year, monthNumber - 1, 1);
  const end = new Date(year, monthNumber, 1);
  return {
    startDate: formatDateOnly(start),
    endDate: formatDateOnly(end),
  };
}

export async function listExpenses(userId, filters = {}) {
  const conditions = ["user_id = $1"];
  const params = [userId];
  let index = 2;

  if (filters.categoryId) {
    params.push(filters.categoryId);
    conditions.push(`category_id = $${index++}`);
  }
  if (filters.startDate) {
    params.push(filters.startDate);
    conditions.push(`expense_date >= $${index++}`);
  }
  if (filters.endDate) {
    params.push(filters.endDate);
    conditions.push(`expense_date <= $${index++}`);
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(`description ILIKE $${index++}`);
  }

  const where = conditions.join(" AND ");
  const { rows } = await getPool().query(
    `SELECT id, user_id, category_id, amount, description, expense_date, created_at, updated_at
     FROM expenses
     WHERE ${where}
     ORDER BY expense_date DESC, id DESC`,
    params
  );
  return rows;
}

export async function createExpense(userId, data) {
  const { rows } = await getPool().query(
    `INSERT INTO expenses (user_id, category_id, amount, description, expense_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, category_id, amount, description, expense_date, created_at, updated_at`,
    [userId, data.categoryId, data.amount, data.description, data.expenseDate]
  );
  return rows[0];
}

export async function findExpenseById(id, userId) {
  const { rows } = await getPool().query(
    `SELECT id, user_id, category_id, amount, description, expense_date, created_at, updated_at
     FROM expenses
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return rows[0] || null;
}

export async function updateExpense(id, userId, data) {
  const { rows } = await getPool().query(
    `UPDATE expenses
     SET category_id = $1, amount = $2, description = $3, expense_date = $4, updated_at = now()
     WHERE id = $5 AND user_id = $6
     RETURNING id, user_id, category_id, amount, description, expense_date, created_at, updated_at`,
    [data.categoryId, data.amount, data.description, data.expenseDate, id, userId]
  );
  return rows[0] || null;
}

export async function deleteExpense(id, userId) {
  const { rows } = await getPool().query(
    `DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId]
  );
  return rows[0] || null;
}

export async function getSummary(userId, month) {
  const { startDate, endDate } = monthRange(month);

  const totalResult = await getPool().query(
    `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count
     FROM expenses
     WHERE user_id = $1 AND expense_date >= $2 AND expense_date < $3`,
    [userId, startDate, endDate]
  );

  const byCategory = await getPool().query(
    `SELECT category_id, COALESCE(SUM(amount), 0) AS total
     FROM expenses
     WHERE user_id = $1 AND expense_date >= $2 AND expense_date < $3
     GROUP BY category_id
     ORDER BY SUM(amount) DESC`,
    [userId, startDate, endDate]
  );

  const recent = await getPool().query(
    `SELECT id, user_id, category_id, amount, description, expense_date, created_at, updated_at
     FROM expenses
     WHERE user_id = $1
     ORDER BY expense_date DESC, id DESC
     LIMIT 5`,
    [userId]
  );

  return {
    month,
    total: Number(totalResult.rows[0].total),
    count: Number(totalResult.rows[0].count),
    byCategory: byCategory.rows.map((row) => ({
      categoryId: row.category_id,
      total: Number(row.total),
    })),
    recent: recent.rows,
  };
}
