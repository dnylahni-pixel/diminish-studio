import pino from "pino";
import { backendConfig } from "../config";

const isProduction = backendConfig.nodeEnvironment === "production";

export const logger = pino({
  level: backendConfig.logLevel,
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});
