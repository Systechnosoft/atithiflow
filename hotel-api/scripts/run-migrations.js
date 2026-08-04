import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import crypto from "crypto";
import { Client } from "pg";

dotenv.config({ path: new URL("../.env", import.meta.url) });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.join(__dirname, "../migrations");
const MIGRATIONS_TABLE = "schema_migrations";

if (!process.env.DATABASE_URL) {
  console.error("[ERROR] Missing DATABASE_URL. Cannot run migrations.");
  process.exit(1);
}

function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Migration directory not found: ${MIGRATIONS_DIR}`);
  }

  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function cryptoChecksum(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function runMigration(client, fileName) {
  const fullPath = path.join(MIGRATIONS_DIR, fileName);
  const sql = fs.readFileSync(fullPath, "utf8").trim();

  if (!sql) {
    console.warn(`[WARNING] Skipping empty migration file: ${fileName}`);
    return;
  }

  console.log(`[INFO] Applying migration: ${fileName}`);
  await client.query("BEGIN");

  try {
    await client.query(sql);
    await client.query(
      `INSERT INTO public.${MIGRATIONS_TABLE} (filename, checksum) VALUES ($1, $2) ON CONFLICT (filename) DO NOTHING`,
      [fileName, cryptoChecksum(fullPath)]
    );
    await client.query("COMMIT");
    console.log(`[SUCCESS] Applied migration: ${fileName}`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(`[ERROR] Failed migration ${fileName}: ${error.message}`);
    throw error;
  }
}

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query(`CREATE TABLE IF NOT EXISTS public.${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);

    const files = getMigrationFiles();
    if (!files.length) {
      console.log("[INFO] No migrations found.");
      process.exit(0);
    }

    const { rows: appliedRows } = await client.query(`SELECT filename FROM public.${MIGRATIONS_TABLE}`);
    const applied = new Set(appliedRows.map((row) => row.filename));
    const pending = files.filter((fileName) => !applied.has(fileName));

    if (!pending.length) {
      console.log("[INFO] No pending migrations. Database is up-to-date.");
      process.exit(0);
    }

    for (const fileName of pending) {
      await runMigration(client, fileName);
    }

    console.log("[SUCCESS] All pending migrations applied successfully.");
    process.exit(0);
  } catch (error) {
    console.error("[ERROR] Migration execution failed.");
    console.error(`Cause: ${error.message}`);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
})();
