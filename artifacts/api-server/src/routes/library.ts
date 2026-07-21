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
    const [user] = await db
      .select({
        storageUsedBytes: usersTable.storageUsedBytes,
        storageQuotaBytes: usersTable.storageQuotaBytes,
      })
      .from(usersTable)
      .where(eq(usersTable.id, dbUserId));
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({
      storageUsedBytes: user.storageUsedBytes,
      storageQuotaBytes: user.storageQuotaBytes,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to get storage quota" });
  }
});

export default router;
