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
import { libraryTable, songs, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

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
    const entries = await db.select().from(libraryTable).where(eq(libraryTable.userId, dbUserId));
    const result = await Promise.all(entries.map(async (entry) => {
      const [song] = await db.select().from(songsTable).where(eq(songsTable.id, entry.songId));
      return { id: entry.id, songId: entry.songId, addedAt: entry.addedAt.toISOString(), song };
    }));
    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to get library" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const dbUserId = await getDbUserId(userId);
    const { songId } = req.body;
    const [entry] = await db.insert(libraryTable).values({ userId: dbUserId, songId }).returning();
    const [song] = await db.select().from(songsTable).where(eq(songsTable.id, songId));
    return res.status(201).json({ id: entry.id, songId: entry.songId, addedAt: entry.addedAt.toISOString(), song });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to add to library" });
  }
});

router.delete("/:songId", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const dbUserId = await getDbUserId(userId);
    const songId = parseInt(req.params.songId);
    await db.delete(libraryTable).where(and(eq(libraryTable.userId, dbUserId), eq(libraryTable.songId, songId)));
    return res.status(204).send();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to remove from library" });
  }
});

export default router;
