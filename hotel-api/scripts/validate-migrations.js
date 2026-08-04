import dotenv from "dotenv";
import { Client } from "pg";
import { MIGRATIONS_DIR, MIGRATIONS_TABLE, getMigrationFiles, migrationMetadata } from "./migration-utils.js";

dotenv.config({ path: new URL("../.env", import.meta.url) });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("[ERROR] Missing DATABASE_URL. Cannot validate migrations without database connection string.");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    if (!MIGRATIONS_DIR || !getMigrationFiles().length) {
      console.error(`[ERROR] Migration directory is missing or empty: ${MIGRATIONS_DIR}`);
      process.exit(1);
    }

    await client.connect();

    await client.query(`CREATE TABLE IF NOT EXISTS public.${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);

    const fileNames = getMigrationFiles();
    const fileMetadata = fileNames.map(migrationMetadata);

    const { rows: appliedRows } = await client.query(`SELECT filename, checksum FROM public.${MIGRATIONS_TABLE} ORDER BY filename`);
    const appliedByName = new Map(appliedRows.map((row) => [row.filename, row.checksum]));

    const pending = fileMetadata.filter((file) => !appliedByName.has(file.name));
    const drift = fileMetadata.filter((file) => appliedByName.has(file.name) && appliedByName.get(file.name) !== file.checksum);
    const orphaned = appliedRows.filter((row) => !fileNames.includes(row.filename));

    if (drift.length) {
      console.error("[ERROR] Migration drift detected.");
      drift.forEach((file) => console.error(` - ${file.name} changed after it was applied.`));
      console.error("[ERROR] Review migrated SQL files and migration history before proceeding.");
      process.exit(1);
    }

    if (orphaned.length) {
      console.warn("[WARNING] Applied migration records exist that are not present on disk:");
      orphaned.forEach((row) => console.warn(` - ${row.filename}`));
    }

    console.log(`[INFO] Found ${fileNames.length} migration file(s).`);
    console.log(`[INFO] Applied migrations: ${appliedRows.length}`);
    console.log(`[INFO] Pending migrations: ${pending.length}`);

    if (pending.length) {
      pending.forEach((file) => console.log(` - Pending: ${file.name}`));
      process.exit(0);
    }

    console.log("[SUCCESS] Migration validation completed. No pending migrations.");
    process.exit(0);
  } catch (error) {
    console.error("[ERROR] Migration validation failed:", error.message);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
})();
