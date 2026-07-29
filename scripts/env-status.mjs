import { existsSync } from "node:fs";
import process from "node:process";

const envFile = ".env.local";

if (!existsSync(envFile)) {
  console.error("Environment status unavailable: .env.local is missing.");
  process.exit(1);
}

process.loadEnvFile(envFile);

function groupStatus(keys) {
  const configured = keys.filter((key) => Boolean(process.env[key])).length;

  if (configured === 0) {
    return "missing";
  }

  return configured === keys.length ? "configured" : "incomplete";
}

const report = {
  applicationEnvironment: process.env.APP_ENVIRONMENT ?? "missing",
  databaseEnvironment: process.env.DATABASE_ENVIRONMENT ?? "missing",
  migrations:
    process.env.RUN_MIGRATIONS === "true" ? "enabled" : "disabled",
  frontend: groupStatus([
    "VITE_APP_ENVIRONMENT",
    "VITE_API_BASE_URL",
    "VITE_CLERK_PUBLISHABLE_KEY",
  ]),
  database: groupStatus(["DATABASE_URL"]),
  clerk: groupStatus([
    "CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
  ]),
  objectStorage: groupStatus([
    "B2_ENDPOINT",
    "B2_REGION",
    "B2_KEY_ID",
    "B2_APPLICATION_KEY",
    "BUCKET_NAME",
  ]),
  runPod: groupStatus(["RUNPOD_ENDPOINT", "RUNPOD_API_KEY"]),
};

console.log(JSON.stringify(report, null, 2));
