import "./_env.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
if (!process.env.DATABASE_URL) {
  console.log("No DATABASE_URL set — running in MOCK mode, no migration needed.");
} else {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const sql = fs.readFileSync(path.join(__dirname, "..", "db", "schema.sql"), "utf8");
  await pool.query(sql);
  console.log("Migration applied.");
  await pool.end();
}
