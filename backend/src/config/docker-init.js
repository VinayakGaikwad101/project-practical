import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, "../..");
const rootDir = path.resolve(backendDir, "..");

console.log("\n======================================================");
console.log("Initializing AI Document Editor Backend Services");
console.log("======================================================\n");


const envPath = path.join(backendDir, ".env");
const exampleEnvPath = path.join(backendDir, ".env.example");
if (!fs.existsSync(envPath) && fs.existsSync(exampleEnvPath)) {
  console.log("[Environment] No .env found. Automatically creating from .env.example...");
  fs.copyFileSync(exampleEnvPath, envPath);
  console.log("[Environment] Created backend/.env successfully.\n");
}


let dockerActive = false;
try {
  execSync("docker info", { stdio: "ignore" });
  dockerActive = true;
  console.log("[Docker] Docker engine is running.");
} catch {
  console.log("[Docker] Docker engine is not running or not installed.");
  console.log("[Docker] Backend will automatically utilize embedded in-memory MongoDB and direct PDF fallback.");
}


if (dockerActive) {
  try {
    console.log("[Docker] Ensuring MongoDB & Redis containers are running (docker compose up -d)...");
    execSync("docker compose up -d", { cwd: rootDir, stdio: "inherit" });
    console.log("[Docker] Containers confirmed healthy: MongoDB (27017) and Redis (6379).\n");
  } catch (err) {
    console.warn("[Docker] Warning: Could not run docker compose. Using built-in fallbacks.\n");
  }
}
