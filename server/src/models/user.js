import { getPool } from "../config/db.js";

export async function createUser({ name, email, passwordHash }) {
  const { rows } = await getPool().query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at, updated_at`,
    [name, email, passwordHash]
  );
  return rows[0];
}

export async function findUserByEmail(email) {
  const { rows } = await getPool().query(
    `SELECT id, name, email, password_hash, created_at, updated_at
     FROM users
     WHERE email = $1`,
    [email]
  );
  return rows[0] || null;
}

export async function findUserById(id) {
  const { rows } = await getPool().query(
    `SELECT id, name, email, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function updateUserName(id, name) {
  const { rows } = await getPool().query(
    `UPDATE users
     SET name = $1, updated_at = now()
     WHERE id = $2
     RETURNING id, name, email, created_at, updated_at`,
    [name, id]
  );
  return rows[0] || null;
}

export async function updateUserPassword(id, passwordHash) {
  await getPool().query(
    `UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`,
    [passwordHash, id]
  );
}
