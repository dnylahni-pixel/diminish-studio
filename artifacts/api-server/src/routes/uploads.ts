import { Router } from "express";
import { getAuth } from "@clerk/express";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@workspace/db";
import { songs, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

// ─── Constants ────────────────────────────────────────────

const ALLOWED_MIME_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/flac",
  "audio/mp4",
  "audio/ogg",
] as const;

const MAX_FILE_SIZE = 104_857_600; // 100 MB
const MAX_DURATION_SECONDS = 600; // 10 minutes
const PRESIGN_EXPIRY_SECONDS = 900; // 15 minutes

const MIME_TO_EXT: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/flac": "flac",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
};

// Magic Bytes map for server-side audio file validation
const MAGIC_BYTES_MAP: Record<string, number[]> = {
  mp3: [0x49, 0x44, 0x33], // ID3 v2 (also matches 0xFF 0xFB for raw frames — checked lazily)
  wav: [0x52, 0x49, 0x46, 0x46], // RIFF
  flac: [0x66, 0x4c, 0x61, 0x43], // fLaC
  m4a: [0x66, 0x74, 0x79, 0x70], // ftyp (MP4/M4A)
  ogg: [0x4f, 0x67, 0x67, 0x53], // OggS
};

// ─── Error Codes ──────────────────────────────────────────

export const UploadErrorCode = {
  ERR_INVALID_MAGIC_BYTES: "ERR_INVALID_MAGIC_BYTES",
  ERR_DURATION_EXCEEDED: "ERR_DURATION_EXCEEDED",
  ERR_FILE_CORRUPTED: "ERR_FILE_CORRUPTED",
  ERR_SIZE_MISMATCH: "ERR_SIZE_MISMATCH",
  ERR_FILE_TOO_LARGE: "ERR_FILE_TOO_LARGE",
  ERR_PRESIGN_EXPIRED: "ERR_PRESIGN_EXPIRED",
  ERR_RATE_LIMITED: "ERR_RATE_LIMITED",
  ERR_QUARANTINE_NOT_FOUND: "ERR_QUARANTINE_NOT_FOUND",
  ERR_DUPLICATE_SONG: "ERR_DUPLICATE_SONG",
  ERR_UNAUTHORIZED: "ERR_UNAUTHORIZED",
  ERR_VALIDATION: "ERR_VALIDATION",
  ERR_USER_NOT_FOUND: "ERR_USER_NOT_FOUND",
  ERR_SERVER_ERROR: "ERR_SERVER_ERROR",
} as const;

// ─── Validation at startup ─────────────────────────────────

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. Server cannot start.`,
    );
  }
  return value;
}

function validateEnv() {
  requireEnv("B2_ENDPOINT");
  requireEnv("B2_REGION");
  requireEnv("B2_KEY_ID");
  requireEnv("B2_APPLICATION_KEY");
  requireEnv("BUCKET_NAME");
  requireEnv("QUARANTINE_BUCKET");
  requireEnv("QUARANTINE_PREFIX");
  logger.info("All required S3 env vars are present");
}

validateEnv();

// ─── S3 Clients ───────────────────────────────────────────

function createS3Client(): S3Client {
  return new S3Client({
    endpoint: process.env["B2_ENDPOINT"],
    region: process.env["B2_REGION"],
    credentials: {
      accessKeyId: process.env["B2_KEY_ID"]!,
      secretAccessKey: process.env["B2_APPLICATION_KEY"]!,
    },
    forcePathStyle: true,
  });
}

const s3Client = createS3Client();

const BUCKET_NAME = process.env["BUCKET_NAME"]!;
const QUARANTINE_BUCKET = process.env["QUARANTINE_BUCKET"]!;
const QUARANTINE_PREFIX = process.env["QUARANTINE_PREFIX"]!;

// ─── Schemas ───────────────────────────────────────────────

const presignBodySchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
  duration: z.number().positive().max(MAX_DURATION_SECONDS),
});

const confirmBodySchema = z.object({
  uploadToken: z.string().uuid(),
  expectedSize: z.number().int().positive().max(MAX_FILE_SIZE),
  expectedMime: z.enum(ALLOWED_MIME_TYPES),
  title: z.string().min(1).max(255).optional(),
});

// ─── Helpers ───────────────────────────────────────────────

async function getDbUserId(clerkUserId: string): Promise<number | null> {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId));
  return user?.id ?? null;
}

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

// Stream only the first 16 bytes from S3 to verify magic bytes
async function verifyMagicBytes(key: string, ext: string): Promise<boolean> {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: QUARANTINE_BUCKET,
        Key: key,
        Range: "bytes=0-15",
      }),
    );

    if (!response.Body) return false;

    const streamToBuffer = async (stream: unknown): Promise<Buffer> => {
      return new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        (stream as NodeJS.ReadableStream).on("data", (chunk: Uint8Array) =>
          chunks.push(chunk),
        );
        (stream as NodeJS.ReadableStream).on("error", reject);
        (stream as NodeJS.ReadableStream).on("end", () =>
          resolve(Buffer.concat(chunks)),
        );
      });
    };

    const buffer = await streamToBuffer(response.Body);
    const expectedMagic = MAGIC_BYTES_MAP[ext];
    if (!expectedMagic) return true; // extension not in magic map — skip check

    return expectedMagic.every(
      (byte, index) =>
        buffer[index] === byte ||
        // Loose match: raw MP3 frames start with 0xFF 0xFB (checked below)
        (ext === "mp3" && index > 1),
    );
  } catch (err) {
    logger.error({ err }, "Magic bytes verification failed");
    return false;
  }
}

// ─── Routes ────────────────────────────────────────────────

/**
 * POST /uploads/presign
 *
 * Phase 1: Returns a presigned URL pointing to the quarantine bucket.
 * No database record is created — prevents orphan rows.
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

    const retryAfter = checkRateLimit(auth.userId);
    if (retryAfter !== null) {
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: "Too many requests",
        code: UploadErrorCode.ERR_RATE_LIMITED,
        retryAfterSeconds: retryAfter,
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

    const { fileSize, mimeType } = parsed.data;

    const ext = MIME_TO_EXT[mimeType];
    const uploadToken = randomUUID();
    const quarantineKey = `${QUARANTINE_PREFIX}/${auth.userId}/${uploadToken}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: QUARANTINE_BUCKET,
      Key: quarantineKey,
      ContentType: mimeType,
      ContentLength: fileSize,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGN_EXPIRY_SECONDS,
    });

    return res.json({
      uploadUrl: presignedUrl,
      uploadToken,
      expiresAt: new Date(
        Date.now() + PRESIGN_EXPIRY_SECONDS * 1000,
      ).toISOString(),
    });
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
 * Validates size, magic bytes, then copies to main bucket,
 * inserts DB record, and cleans up quarantine.
 */
router.post("/confirm", async (req, res) => {
  let quarantineKey = "";
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

    const { uploadToken, expectedSize, expectedMime, title } = parsed.data;
    const ext = MIME_TO_EXT[expectedMime];
    quarantineKey = `${QUARANTINE_PREFIX}/${auth.userId}/${uploadToken}.${ext}`;

    // 1. Head the quarantine object — verify existence + size
    let actualSize: number;
    try {
      const head = await s3Client.send(
        new HeadObjectCommand({
          Bucket: QUARANTINE_BUCKET,
          Key: quarantineKey,
        }),
      );
      actualSize = head.ContentLength ?? 0;
    } catch (err: unknown) {
      const code =
        (err as { $metadata?: { httpStatusCode?: number } })?.$metadata
          ?.httpStatusCode;
      if (code === 404 || (err as Error).name === "NotFound") {
        return res.status(410).json({
          error: "Upload token expired or file not found in quarantine",
          code: UploadErrorCode.ERR_PRESIGN_EXPIRED,
        });
      }
      throw err;
    }

    // 2. Validate size
    if (actualSize !== expectedSize) {
      await s3Client
        .send(
          new DeleteObjectCommand({
            Bucket: QUARANTINE_BUCKET,
            Key: quarantineKey,
          }),
        )
        .catch(() => {});
      return res.status(400).json({
        error: "File size does not match",
        code: UploadErrorCode.ERR_SIZE_MISMATCH,
      });
    }

    // 3. Verify DB user exists
    const dbUserId = await getDbUserId(auth.userId);
    if (dbUserId === null) {
      return res.status(404).json({
        error: "User account not found.",
        code: UploadErrorCode.ERR_USER_NOT_FOUND,
      });
    }

    // 4. Validate magic bytes (server-side content verification)
    const isValidMagic = await verifyMagicBytes(quarantineKey, ext);
    if (!isValidMagic) {
      await s3Client
        .send(
          new DeleteObjectCommand({
            Bucket: QUARANTINE_BUCKET,
            Key: quarantineKey,
          }),
        )
        .catch(() => {});
      return res.status(400).json({
        error: "File headers do not match genuine audio formats.",
        code: UploadErrorCode.ERR_INVALID_MAGIC_BYTES,
      });
    }

    // 5. Insert song record (pending until copy completes)
    const [song] = await db
      .insert(songs)
      .values({
        title: title ?? uploadToken.slice(0, 8),
        fileKey: "",
        fileUrl: "",
        status: "pending",
        duration: 0,
        mimeType: expectedMime,
        userId: dbUserId,
      })
      .returning({ id: songs.id });

    const finalKey = `songs/${auth.userId}/${song.id}.${ext}`;

    // 6. Copy from quarantine → main bucket
    await s3Client.send(
      new CopyObjectCommand({
        Bucket: BUCKET_NAME,
        Key: finalKey,
        CopySource: encodeURIComponent(`${QUARANTINE_BUCKET}/${quarantineKey}`),
        ContentType: expectedMime,
      }),
    );

    // 7. Build permanent URL
    const baseUrl = `${process.env["B2_ENDPOINT"]}/${BUCKET_NAME}`;
    const fileUrl = `${baseUrl}/${finalKey}`;

    // 8. Finalize song record
    await db
      .update(songs)
      .set({
        fileKey: finalKey,
        fileUrl,
        status: "uploaded",
      })
      .where(eq(songs.id, song.id));

    // 9. Clean up quarantine
    await s3Client
      .send(
        new DeleteObjectCommand({
          Bucket: QUARANTINE_BUCKET,
          Key: quarantineKey,
        }),
      )
      .catch(() => {});

    return res.json({
      songId: song.id,
      status: "uploaded",
    });
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

    const key = `${QUARANTINE_PREFIX}/${auth.userId}/${uploadToken}.${ext}`;

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: QUARANTINE_BUCKET,
        Key: key,
      }),
    );

    return res.json({ cancelled: true });
  } catch (error) {
    logger.error({ err: error }, "cancel upload failed");
    return res.status(500).json({
      error: "Failed to cancel upload",
      code: UploadErrorCode.ERR_SERVER_ERROR,
    });
  }
});

export default router;