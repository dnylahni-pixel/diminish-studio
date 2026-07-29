import { backendConfig } from "./config";
import { logger } from "./lib/logger";

const { default: app } = await import("./app");

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
