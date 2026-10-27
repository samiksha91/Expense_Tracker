import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPool } from "../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "migrations");

function splitStatements(sql) {
  return sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function migrate() {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const { rows } = await pool.query("SELECT name FROM schema_migrations");
  const applied = new Set(rows.map((row) => row.name));

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    const statements = splitStatements(sql);

    await pool.query("BEGIN");
    try {
      for (const statement of statements) {
        await pool.query(statement);
      }
      await pool.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      await pool.query("COMMIT");
      console.log(`Applied migration: ${file}`);
    } catch (err) {
      await pool.query("ROLLBACK");
      throw err;
    }
  }

  await pool.end();
  console.log("Migrations complete.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
