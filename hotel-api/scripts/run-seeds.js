import { spawn } from "child_process";

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: true });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed: ${command} ${args.join(" ")} (exit ${code})`));
      }
    });
  });
}

(async () => {
  try {
    console.log("[INFO] Executing seed script...");
    await runCommand("node", ["./scripts/seed-master-data.js"]);
    console.log("[SUCCESS] Seed script completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("[ERROR] Seed execution failed.");
    console.error(`Cause: ${error.message}`);
    process.exit(1);
  }
})();
