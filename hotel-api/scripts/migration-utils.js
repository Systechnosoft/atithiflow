import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config({ path: new URL("../.env", import.meta.url) });

export const MIGRATIONS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "migrations"
);

export const MIGRATIONS_TABLE = "schema_migrations";

export function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Migration directory not found: ${MIGRATIONS_DIR}`);
  }

  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export function fileChecksum(filePath) {
  const contents = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(contents).digest("hex");
}

export function migrationMetadata(fileName) {
  const fullPath = path.join(MIGRATIONS_DIR, fileName);
  return {
    name: fileName,
    path: fullPath,
    checksum: fileChecksum(fullPath),
  };
}

export function formatMigrationStatus(pending, applied, drift, orphaned) {
  const lines = [];
  lines.push(`[INFO] Migrations directory: ${MIGRATIONS_DIR}`);
  lines.push(`[INFO] Total migration files found: ${pending.length + applied.length}`);
  lines.push(`[INFO] Applied migration records: ${applied.length}`);
  if (pending.length) lines.push(`[INFO] Pending migrations: ${pending.length}`);
  if (drift.length) lines.push(`[WARNING] Detected migration drift: ${drift.length} file(s) changed since they were applied.`);
  if (orphaned.length) lines.push(`[WARNING] Applied migration records missing from disk: ${orphaned.length}`);
  return lines.join("\n");
}
