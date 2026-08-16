import { Router } from "express";
import { getAuth } from "@clerk/express";
import { z } from "zod";
import { logger } from "../../lib/logger";
import { UploadErrorCode } from "./uploads.types";
import { presignBodySchema, confirmBodySchema } from "./uploads.schema";
import {
  handlePresign,
  handleConfirm,
  handleCancel,
} from "./uploads.service";

const router = Router();

/**
 * POST /uploads/presign
 *
 * Phase 1: Returns a presigned URL pointing to the quarantine prefix
 * within the same bucket. No database record is created — prevents
 * orphan rows when the user abandons the upload.
 */
router.post("/presign", async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) {
      return res.status(401).json({
        error: "Unauthorized",
        code: UploadErrorCode.ERR_UNAUTHORIZED,
      });
    }

    const parsed = presignBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        code: UploadErrorCode.ERR_VALIDATION,
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await handlePresign(parsed.data, auth.userId);

    if (result.headers) {
      for (const [key, value] of Object.entries(result.headers)) {
        res.set(key, value);
      }
    }
    return res.status(result.status).json(result.body);
  } catch (error) {
    logger.error({ err: error }, "presign failed");
    return res.status(500).json({
      error: "Failed to generate upload URL",
      code: UploadErrorCode.ERR_SERVER_ERROR,
    });
  }
});

/**
 * POST /uploads/confirm
 *
 * Phase 2: Client calls after PUT to quarantine completes.
 * Validates size, magic bytes, then copies to the permanent
 * `songs/` prefix, inserts DB record, and cleans up quarantine.
 */
router.post("/confirm", async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) {
      return res.status(401).json({
        error: "Unauthorized",
        code: UploadErrorCode.ERR_UNAUTHORIZED,
      });
    }

    const parsed = confirmBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        code: UploadErrorCode.ERR_VALIDATION,
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await handleConfirm(parsed.data, auth.userId);
    return res.status(result.status).json(result.body);
  } catch (error) {
    logger.error({ err: error }, "confirm failed");
    return res.status(500).json({
      error: "Failed to confirm upload",
      code: UploadErrorCode.ERR_SERVER_ERROR,
    });
  }
});

/**
 * DELETE /uploads/:uploadToken/:ext
 *
 * Cancel an in-progress upload by removing the quarantine object.
 */
router.delete("/:uploadToken/:ext", async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) {
      return res.status(401).json({
        error: "Unauthorized",
        code: UploadErrorCode.ERR_UNAUTHORIZED,
      });
    }

    const { uploadToken, ext } = req.params;

    if (!z.string().uuid().safeParse(uploadToken).success || !ext) {
      return res.status(400).json({
        error: "Invalid request parameters",
        code: UploadErrorCode.ERR_VALIDATION,
      });
    }

    const result = await handleCancel(uploadToken, ext, auth.userId);
    return res.status(result.status).json(result.body);
  } catch (error) {
    logger.error({ err: error }, "cancel upload failed");
    return res.status(500).json({
      error: "Failed to cancel upload",
      code: UploadErrorCode.ERR_SERVER_ERROR,
    });
  }
});

export default router;