import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: new URL("../.env", import.meta.url) });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[ERROR] Missing DATABASE_URL. Cannot validate seeding process.");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    await client.connect();
    console.log("[INFO] Checking seed status...");

    const roleResult = await client.query("SELECT COUNT(*) AS count FROM public.roles");
    const roleCount = parseInt(roleResult.rows[0]?.count || "0", 10);

    if (roleCount > 0) {
      console.log("[WARNING] Database appears to already contain seed data. Skipping seed step.");
      process.exit(2);
    }

    console.log("[INFO] Seed data not found. Seed step is required.");
    process.exit(0);
  } catch (error) {
    console.error("[ERROR] Seed validation failed.");
    console.error(`Cause: ${error.message}`);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
})();
