import { createRequire } from "module";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const packagePath = path.join(new URL("../package.json", import.meta.url).pathname);

if (!fs.existsSync(packagePath)) {
  console.error("[ERROR] package.json not found in hotel-api directory.");
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const runtimeDeps = Object.keys(packageJson.dependencies || {});
const missing = [];

for (const dependency of runtimeDeps) {
  try {
    require.resolve(dependency);
  } catch (error) {
    missing.push(dependency);
  }
}

if (missing.length) {
  console.error("[ERROR] Missing runtime dependency(ies):");
  missing.forEach((dep) => console.error(` - ${dep}`));
  console.error("[ERROR] Run 'npm ci' in hotel-api before starting the application.");
  process.exit(1);
}

if (!fs.existsSync(path.join(new URL("../node_modules", import.meta.url).pathname))) {
  console.error("[ERROR] node_modules directory is missing.");
  console.error("[ERROR] Install dependencies with 'npm ci' before starting.");
  process.exit(1);
}

console.log("[INFO] Dependency validation passed.");
process.exit(0);
