declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        sessionId: string;
      };
    }
  }
}

import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { songs, artists, usersTable, songAnalyses, songStems } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import {
  getStorageQuota,
  decrementStorageUsed,
} from "./uploads/uploads.repository";
import { findUserByClerkId, getOrCreateUser } from "../lib/user-utils";
import { ClerkServiceError, ClerkErrorKind } from "../lib/errors";
import { backendConfig } from "../config";
import { sendError } from "../lib/http-errors";

const s3Client = new S3Client({
  endpoint: backendConfig.b2.endpoint,
  region: backendConfig.b2.region,
  credentials: {
    accessKeyId: backendConfig.b2.keyId,
    secretAccessKey: backendConfig.b2.applicationKey,
  },
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

const BUCKET_NAME = backendConfig.b2.bucketName;

/** Extract the S3 object key from a full B2 URL */
function extractKeyFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    // Path is /{bucket}/{key} or /{key} depending on endpoint style
    const path = u.pathname.replace(/^\//, "");
    // Remove bucket name prefix if present (path-style)
    if (path.startsWith(BUCKET_NAME + "/")) {
      return path.slice(BUCKET_NAME.length + 1);
    }
    // Virtual-hosted style: bucket is in hostname, path is just /key
    return path || null;
  } catch {
    return null;
  }
}

const router = Router();

/**
 * Resolve the DB user row. For read operations we auto-create on first visit.
 * For destructive operations (DELETE) callers should use a separate lookup-only path.
 */
async function resolveDbUser(clerkUserId: string) {
  return getOrCreateUser(clerkUserId);
}

/** Look up a user row WITHOUT auto-create (for destructive / sensitive operations) */
async function findDbUser(clerkUserId: string) {
  return findUserByClerkId(clerkUserId);
}

/** Map a ClerkServiceError into a response-contract shape */
function clerkErrorToResponse(err: ClerkServiceError) {
  switch (err.kind) {
    case ClerkErrorKind.NotFound:
      return {
        status: 401,
        body: { error: "Invalid session", code: "INVALID_SESSION" },
      };
    case ClerkErrorKind.RateLimited:
      return {
        status: 429,
        body: {
          error: "Authentication service busy",
          code: "AUTH_RATE_LIMITED",
          retryAfterSeconds: 60,
        },
      };
    case ClerkErrorKind.Unavailable:
    default:
      return {
        status: 502,
        body: {
          error: "Authentication service unavailable",
          code: "AUTH_SERVICE_UNAVAILABLE",
        },
      };
  }
}

router.get("/", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return sendError(res, 401, "UNAUTHORIZED", "Unauthorized");
    }
    const dbUser = await resolveDbUser(userId);
    const result = await db
      .select({
        id: songs.id,
        title: songs.title,
        artist: artists.name,
        artistId: songs.artistId,
        difficulty: songs.difficulty,
        duration: songs.duration,
        bpm: songs.bpm,
        musicalKey: songs.musicalKey,
        mode: songs.mode,
        timeSignature: songs.timeSignature,
        coverUrl: songs.coverUrl,
        playCount: songs.playCount,
        featured: songs.featured,
        status: songs.status,
        fileKey: songs.fileKey,
        fileUrl: songs.fileUrl,
        mimeType: songs.mimeType,
        createdAt: songs.createdAt,
        updatedAt: songs.updatedAt,
      })
      .from(songs)
      .leftJoin(artists, eq(songs.artistId, artists.id))
      .where(eq(songs.userId, dbUser.id));

    return res.json(
      result.map((s) => ({
        ...s,
        key: s.musicalKey,
      })),
    );
  } catch (e) {
    if (e instanceof ClerkServiceError) {
      const { status, body } = clerkErrorToResponse(e);
      return res.status(status).json(body);
    }
    console.error(e);
    return sendError(
      res,
      500,
      "LIBRARY_READ_FAILED",
      "Failed to get library",
    );
  }
});

router.get("/quota", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return sendError(res, 401, "UNAUTHORIZED", "Unauthorized");
    }
    const dbUser = await resolveDbUser(userId);
    const quota = await getStorageQuota(dbUser.id);
    return res.json({
      storageUsedBytes: quota.storageUsedBytes,
      storageQuotaBytes: quota.storageQuotaBytes,
    });
  } catch (e) {
    if (e instanceof ClerkServiceError) {
      const { status, body } = clerkErrorToResponse(e);
      return res.status(status).json(body);
    }
    console.error(e);
    return sendError(
      res,
      500,
      "STORAGE_QUOTA_READ_FAILED",
      "Failed to get storage quota",
    );
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return sendError(res, 401, "UNAUTHORIZED", "Unauthorized");
    }

    const songId = parseInt(req.params.id);
    if (isNaN(songId)) {
      return sendError(res, 400, "INVALID_SONG_ID", "Invalid song ID");
    }

    // DELETE must NOT auto-create user. Only allow if user row already exists.
    const dbUser = await findDbUser(userId);
    if (!dbUser) {
      return sendError(
        res,
        401,
        "USER_ACCOUNT_NOT_FOUND",
        "User account not found",
      );
    }

    // 1. Find song with stems info, verify ownership
    const [song] = await db
      .select({
        id: songs.id,
        fileKey: songs.fileKey,
        fileSize: songs.fileSize,
      })
      .from(songs)
      .where(and(eq(songs.id, songId), eq(songs.userId, dbUser.id)));

    if (!song) {
      return sendError(res, 404, "SONG_NOT_FOUND", "Song not found");
    }

    // 2. Fetch stem file keys (to delete from S3)
    const stemsToDelete: string[] = [];
    if (song.fileKey) {
      stemsToDelete.push(song.fileKey);
    }
    const [stemRow] = await db
      .select({
        drumsUrl: songStems.drumsUrl,
        bassUrl: songStems.bassUrl,
        guitarUrl: songStems.guitarUrl,
        pianoUrl: songStems.pianoUrl,
        vocalUrl: songStems.vocalUrl,
        otherUrl: songStems.otherUrl,
      })
      .from(songStems)
      .where(eq(songStems.songId, songId));
    if (stemRow) {
      for (const url of Object.values(stemRow)) {
        if (url && typeof url === "string") {
          const key = extractKeyFromUrl(url);
          if (key) stemsToDelete.push(key);
        }
      }
    }

    // 3. Delete all files from S3 (best-effort, non-blocking)
    await Promise.allSettled(
      stemsToDelete.map((key) =>
        s3Client
          .send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }))
          .catch(() => {}),
      ),
    );

    // 4. Delete related DB records (CASCADE not set, so delete explicitly)
    await db.delete(songAnalyses).where(eq(songAnalyses.songId, songId));
    await db.delete(songStems).where(eq(songStems.songId, songId));
    await db.delete(songs).where(eq(songs.id, song.id));

    // 5. Decrement storage counter (guards against negative)
    await decrementStorageUsed(dbUser.id, song.fileSize ?? 0);

    return res.json({ deleted: true });
  } catch (e) {
    console.error(e);
    return sendError(
      res,
      500,
      "LIBRARY_SONG_DELETE_FAILED",
      "Failed to delete song",
    );
  }
});

export default router;
