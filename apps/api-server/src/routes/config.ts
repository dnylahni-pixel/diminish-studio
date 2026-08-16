import { Router, type IRouter } from "express";
import { GetConfigBootstrapResponse } from "@workspace/api-zod";
import { getRuntimeConfig } from "../lib/runtime-config";
import { sendError } from "../lib/http-errors";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/**
 * GET /config/bootstrap
 *
 * Returns the in-memory runtime config snapshot (version + effective settings)
 * for client bootstrapping. Served entirely from the in-process cache — no DB
 * read on this path. Public: settings are non-secret behavior knobs.
 */
router.get("/bootstrap", async (_req, res) => {
  try {
    const snapshot = await getRuntimeConfig();
    const data = GetConfigBootstrapResponse.parse({
      version: snapshot.version,
      updatedAt: snapshot.updatedAt,
      settings: snapshot.settings,
    });
    return res.json(data);
  } catch (err) {
    logger.error({ err }, "Failed to serve runtime config bootstrap");
    return sendError(
      res,
      500,
      "CONFIG_READ_FAILED",
      "Failed to load runtime config",
    );
  }
});

export default router;
