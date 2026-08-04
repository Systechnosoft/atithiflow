import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: new URL("../.env", import.meta.url) });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("[ERROR] Missing DATABASE_URL.");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    console.log("[INFO] Checking database connectivity...");
    await client.connect();
    const result = await client.query("SELECT 1 AS status");
    if (result.rows?.[0]?.status !== 1) {
      throw new Error("Unexpected response from database.");
    }
    console.log("[SUCCESS] Database connection verified.");
    process.exit(0);
  } catch (error) {
    console.error("[ERROR] Database connection failed. Please verify database host, port, username, password, SSL settings, and network accessibility.");
    console.error(`Cause: ${error.message}`);
    console.error("Suggested fixes:");
    console.error(" - Confirm DATABASE_URL has valid credentials and host information.");
    console.error(" - Confirm the database service is reachable from this container.");
    console.error(" - If using SSL, verify SSL mode and CA trust settings.");
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
})();
