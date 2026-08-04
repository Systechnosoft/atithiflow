import dotenv from "dotenv";

dotenv.config({ path: new URL("../.env", import.meta.url) });

const requiredVariables = [
  "DATABASE_URL",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_JWT_SECRET",
  "SUPERADMIN_EMAIL",
  "SUPERADMIN_PASSWORD"
];

const missing = requiredVariables.filter((name) => {
  const value = process.env[name];
  return value === undefined || value === null || String(value).trim() === "";
});

if (missing.length) {
  console.error("[ERROR] Missing environment variable(s):");
  missing.forEach((name) => console.error(` - ${name}`));
  console.error("[ERROR] Application startup aborted due to missing required environment variables.");
  process.exit(1);
}

console.log("[INFO] Environment validation passed.");
process.exit(0);
