import { backendConfig } from "./config";
import { logger } from "./lib/logger";
import { warmRuntimeConfig } from "./lib/runtime-config";

const { default: app } = await import("./app");

// Warm the runtime config cache before accepting requests so the first request
// never pays a cold load. Failures are logged and tolerated — the cache falls
// back to registry defaults until the next version poll succeeds.
await warmRuntimeConfig();

app.listen(backendConfig.port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info(
    {
      appEnvironment: backendConfig.appEnvironment,
      port: backendConfig.port,
    },
    "Server listening",
  );
});
