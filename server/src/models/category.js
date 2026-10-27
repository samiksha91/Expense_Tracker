import { getPool } from "../config/db.js";

const DEFAULT_CATEGORIES = [
  "Food",
  "Transport",
  "Housing",
  "Utilities",
  "Entertainment",
  "Health",
  "Shopping",
  "Other",
];

export async function createDefaultCategories(userId) {
  for (const name of DEFAULT_CATEGORIES) {
    await getPool().query(
      `INSERT INTO categories (user_id, name) VALUES ($1, $2)`,
      [userId, name]
    );
  }
}

export async function listCategories(userId) {
  const { rows } = await getPool().query(
    `SELECT id, user_id, name, created_at, updated_at
     FROM categories
     WHERE user_id = $1
     ORDER BY name ASC`,
    [userId]
  );
  return rows;
}

export async function createCategory(userId, name) {
  const { rows } = await getPool().query(
    `INSERT INTO categories (user_id, name)
     VALUES ($1, $2)
     RETURNING id, user_id, name, created_at, updated_at`,
    [userId, name]
  );
  return rows[0];
}

export async function findCategoryById(id, userId) {
  const { rows } = await getPool().query(
    `SELECT id, user_id, name FROM categories WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return rows[0] || null;
}

export async function updateCategory(id, userId, name) {
  const { rows } = await getPool().query(
    `UPDATE categories
     SET name = $1, updated_at = now()
     WHERE id = $2 AND user_id = $3
     RETURNING id, user_id, name, created_at, updated_at`,
    [name, id, userId]
  );
  return rows[0] || null;
}

export async function deleteCategory(id, userId) {
  await getPool().query(
    `UPDATE expenses SET category_id = NULL WHERE category_id = $1 AND user_id = $2`,
    [id, userId]
  );

  const { rows } = await getPool().query(
    `DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId]
  );
  return rows[0] || null;
}
