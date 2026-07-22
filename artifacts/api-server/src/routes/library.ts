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
import { getOrCreateUser } from "../lib/user-utils";
import { ClerkServiceError, ClerkErrorKind } from "../lib/errors";

const s3Client = new S3Client({
  endpoint: process.env["B2_ENDPOINT"],
  region: process.env["B2_REGION"],
  credentials: {
    accessKeyId: process.env["B2_KEY_ID"]!,
    secretAccessKey: process.env["B2_APPLICATION_KEY"]!,
  },
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

const BUCKET_NAME = process.env["BUCKET_NAME"]!;

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
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId));
  return user ?? null;
}

/** Map a ClerkServiceError into a response-contract shape */
function clerkErrorToResponse(err: ClerkServiceError) {
  switch (err.kind) {
    case ClerkErrorKind.NotFound:
      return { status: 401, body: { error: "Invalid session" } };
    case ClerkErrorKind.RateLimited:
      return {
        status: 429,
        body: {
          error: "Authentication service busy",
          retryAfterSeconds: 60,
        },
      };
    case ClerkErrorKind.Unavailable:
    default:
      return {
        status: 502,
        body: { error: "Authentication service unavailable" },
      };
  }
}

router.get("/", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
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
    return res.status(500).json({ error: "Failed to get library" });
  }
});

router.get("/quota", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
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
    return res.status(500).json({ error: "Failed to get storage quota" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const songId = parseInt(req.params.id);
    if (isNaN(songId)) return res.status(400).json({ error: "Invalid song ID" });

    // DELETE must NOT auto-create user. Only allow if user row already exists.
    const dbUser = await findDbUser(userId);
    if (!dbUser) {
      return res.status(401).json({ error: "User account not found" });
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

    if (!song) return res.status(404).json({ error: "Song not found" });

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
    return res.status(500).json({ error: "Failed to delete song" });
  }
});

export default router;