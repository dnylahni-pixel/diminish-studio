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
import { songs, artists, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import {
  getStorageQuota,
  decrementStorageUsed,
} from "./uploads/uploads.repository";

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

const router = Router();

async function getDbUserId(clerkUserId: string): Promise<number> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkUserId));
  if (!user) throw new Error("User not found");
  return user.id;
}

router.get("/", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const dbUserId = await getDbUserId(userId);
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
      .where(eq(songs.userId, dbUserId));

    return res.json(result.map(s => ({
      ...s,
      key: s.musicalKey,
    })));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to get library" });
  }
});

router.get("/quota", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const dbUserId = await getDbUserId(userId);
    const quota = await getStorageQuota(dbUserId);
    return res.json({
      storageUsedBytes: quota.storageUsedBytes,
      storageQuotaBytes: quota.storageQuotaBytes,
    });
  } catch (e) {
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

    const dbUserId = await getDbUserId(userId);

    // 1. Find song and verify ownership
    const [song] = await db
      .select({
        id: songs.id,
        fileKey: songs.fileKey,
        fileSize: songs.fileSize,
      })
      .from(songs)
      .where(and(eq(songs.id, songId), eq(songs.userId, dbUserId)));

    if (!song) return res.status(404).json({ error: "Song not found" });

    // 2. Delete from S3
    if (song.fileKey) {
      await s3Client
        .send(
          new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: song.fileKey,
          }),
        )
        .catch(() => {});
    }

    // 3. Delete song record from DB
    await db.delete(songs).where(eq(songs.id, song.id));

    // 4. Decrement storage counter (guards against negative)
    await decrementStorageUsed(dbUserId, song.fileSize ?? 0);

    return res.json({ deleted: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to delete song" });
  }
});

export default router;
