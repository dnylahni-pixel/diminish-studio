import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import process from "node:process";

const envFile = ".env.local";
const workspaceRoot = process.cwd();

if (!existsSync(envFile)) {
  console.error(
    "Missing .env.local. Copy .env.example to .env.local and fill the local values.",
  );
  process.exit(1);
}

process.loadEnvFile(envFile);

const mode = process.argv[2];
const runWeb = mode !== "--api";
const runApi = mode !== "--web";
const children = [];
let stopping = false;
let requestedExitCode = 0;
let forceStopTimer;

function executable(relativePath) {
  const extension = process.platform === "win32" ? ".cmd" : "";
  return resolve(workspaceRoot, `${relativePath}${extension}`);
}

function start(label, command, args, env, cwd) {
  const child = spawn(command, args, {
    cwd,
    detached: process.platform !== "win32",
    env: { ...process.env, ...env },
    stdio: "inherit",
  });

  child.on("exit", (code, signal) => {
    const childIndex = children.findIndex((entry) => entry.child === child);

    if (childIndex !== -1) {
      children.splice(childIndex, 1);
    }

    if (stopping) {
      finishStop();
      return;
    }

    if (signal) {
      console.error(`${label} exited from signal ${signal}`);
      stop(1);
      return;
    }

    if (code !== 0) {
      console.error(`${label} exited with code ${code}`);
    }

    stop(code ?? 0);
  });

  children.push({ child, label });
}

function signalChild(child, signal) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  if (process.platform === "win32") {
    child.kill(signal);
    return;
  }

  try {
    process.kill(-child.pid, signal);
  } catch (error) {
    if (error.code !== "ESRCH") {
      throw error;
    }
  }
}

function stop(exitCode = 0) {
  if (stopping) {
    return;
  }

  stopping = true;
  requestedExitCode = exitCode;
  console.log("Stopping development servers...");

  if (children.length === 0) {
    finishStop();
    return;
  }

  for (const { child } of children) {
    signalChild(child, "SIGTERM");
  }

  forceStopTimer = setTimeout(() => {
    for (const { child, label } of children) {
      if (child.exitCode === null && child.signalCode === null) {
        console.error(`${label} did not stop in time; forcing shutdown.`);
        signalChild(child, "SIGKILL");
      }
    }
  }, 5_000);

  forceStopTimer.unref();
}

function finishStop() {
  if (!stopping || children.length > 0) {
    return;
  }

  if (forceStopTimer) {
    clearTimeout(forceStopTimer);
  }

  console.log("Development servers stopped.");
  process.exitCode = requestedExitCode;
}

if (runApi) {
  start(
    "api",
    executable("scripts/node_modules/.bin/tsx"),
    ["watch", "src/index.ts"],
    { PORT: process.env.API_PORT || "3000" },
    resolve(workspaceRoot, "apps/api-server"),
  );
}

if (runWeb) {
  start(
    "web",
    executable("apps/diminish-studio/node_modules/.bin/vite"),
    ["--config", "vite.config.ts", "--host", "0.0.0.0"],
    { PORT: process.env.WEB_PORT || "5173" },
    resolve(workspaceRoot, "apps/diminish-studio"),
  );
}

process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
