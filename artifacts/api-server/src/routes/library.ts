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
import { eq } from "drizzle-orm";
import { getStorageQuota } from "./uploads/uploads.repository";

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

export default router;
