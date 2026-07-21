import { randomUUID } from "node:crypto";
import { logger } from "../../lib/logger";
import { UploadErrorCode } from "./uploads.types";
import { MIME_TO_EXT, MAX_DURATION_SECONDS } from "./uploads.constants";
import {
  createPresignedUploadUrl,
  headQuarantineObject,
  copyObject,
  deleteObject,
  verifyMagicBytes,
  BUCKET_NAME,
  QUARANTINE_PREFIX,
} from "./uploads.storage";
import { getDbUserId, insertSong, finalizeSong } from "./uploads.repository";
import type { PresignBody, ConfirmBody } from "./uploads.schema";

// ─── Rate Limiter ──────────────────────────────────────────

const rateWindowMs = 60_000;
const maxRequestsPerWindow = 10;
const requestLog = new Map<string, number[]>();

function checkRateLimit(userId: string): number | null {
  const now = Date.now();
  const timestamps = requestLog.get(userId) ?? [];
  const recent = timestamps.filter((t) => now - t < rateWindowMs);
  if (recent.length >= maxRequestsPerWindow) {
    const oldest = recent[0]!;
    return Math.ceil((oldest + rateWindowMs - now) / 1000);
  }
  recent.push(now);
  requestLog.set(userId, recent);
  return null;
}

// ─── Presign ───────────────────────────────────────────────

export async function handlePresign(body: PresignBody, userId: string) {
  const retryAfter = checkRateLimit(userId);
  if (retryAfter !== null) {
    return {
      status: 429,
      body: {
        error: "Too many requests",
        code: UploadErrorCode.ERR_RATE_LIMITED,
        retryAfterSeconds: retryAfter,
      },
      headers: { "Retry-After": String(retryAfter) },
    };
  }

  const { fileSize, mimeType, duration } = body;

  const ext = MIME_TO_EXT[mimeType];
  const uploadToken = randomUUID();
  const quarantineKey = `${QUARANTINE_PREFIX}/${userId}/${uploadToken}.${ext}`;

  const presignedUrl = await createPresignedUploadUrl(
    quarantineKey,
    mimeType,
    fileSize,
  );

  return {
    status: 200,
    body: {
      uploadUrl: presignedUrl,
      uploadToken,
      expiresAt: new Date(
        Date.now() + 15 * 60 * 1000,
      ).toISOString(),
    },
  };
}

// ─── Confirm ───────────────────────────────────────────────

export async function handleConfirm(body: ConfirmBody, userId: string) {
  const { uploadToken, expectedSize, expectedMime, title, duration } = body;
  const ext = MIME_TO_EXT[expectedMime];
  const quarantineKey = `${QUARANTINE_PREFIX}/${userId}/${uploadToken}.${ext}`;

  // 1. Head the quarantine object — verify existence + size
  let actualSize: number;
  try {
    const head = await headQuarantineObject(quarantineKey);
    actualSize = head.ContentLength ?? 0;
  } catch (err: unknown) {
    const code =
      (err as { $metadata?: { httpStatusCode?: number } })?.$metadata
        ?.httpStatusCode;
    if (code === 404 || (err as Error).name === "NotFound") {
      return {
        status: 410,
        body: {
          error: "Upload token expired or file not found in quarantine",
          code: UploadErrorCode.ERR_PRESIGN_EXPIRED,
        },
      };
    }
    throw err;
  }

  // 2. Validate size
  if (actualSize !== expectedSize) {
    await deleteObject(quarantineKey).catch(() => {});
    return {
      status: 400,
      body: {
        error: "File size does not match",
        code: UploadErrorCode.ERR_SIZE_MISMATCH,
      },
    };
  }

  // 3. Verify DB user exists
  const dbUserId = await getDbUserId(userId);
  if (dbUserId === null) {
    return {
      status: 404,
      body: {
        error: "User account not found.",
        code: UploadErrorCode.ERR_USER_NOT_FOUND,
      },
    };
  }

  // 4. Validate magic bytes (server-side content verification)
  const isValidMagic = await verifyMagicBytes(quarantineKey, ext);
  if (!isValidMagic) {
    await deleteObject(quarantineKey).catch(() => {});
    return {
      status: 400,
      body: {
        error: "File headers do not match genuine audio formats.",
        code: UploadErrorCode.ERR_INVALID_MAGIC_BYTES,
      },
    };
  }

  // 5. Insert song record (pending until copy completes)
  const [song] = await insertSong({
    title: title ?? uploadToken.slice(0, 8),
    fileKey: "",
    fileUrl: "",
    status: "pending",
    duration,
    mimeType: expectedMime,
    userId: dbUserId,
  });

  const finalKey = `songs/${userId}/${song.id}.${ext}`;

  // 6. Copy from quarantine → permanent location within the same bucket
  await copyObject(quarantineKey, finalKey, expectedMime);

  // 7. Build permanent URL
  const baseUrl = `${process.env["B2_ENDPOINT"]}/${BUCKET_NAME}`;
  const fileUrl = `${baseUrl}/${finalKey}`;

  // 8. Finalize song record
  await finalizeSong(song.id, {
    fileKey: finalKey,
    fileUrl,
    status: "uploaded",
  });

  // 9. Clean up quarantine
  await deleteObject(quarantineKey).catch(() => {});

  return {
    status: 200,
    body: {
      songId: song.id,
      status: "uploaded",
    },
  };
}

// ─── Cancel ────────────────────────────────────────────────

export async function handleCancel(
  uploadToken: string,
  ext: string,
  userId: string,
) {
  const key = `${QUARANTINE_PREFIX}/${userId}/${uploadToken}.${ext}`;
  await deleteObject(key);
  return { status: 200, body: { cancelled: true } };
}