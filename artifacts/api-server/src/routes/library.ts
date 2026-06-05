import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { libraryTable, songsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();
router.use(requireAuth());

async function getDbUserId(clerkUserId: string): Promise<number> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkUserId));
  if (!user) throw new Error("User not found");
  return user.id;
}

router.get("/", async (req, res) => {
  try {
    const clerkUserId = req.auth?.userId;
    if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });
    const userId = await getDbUserId(clerkUserId);
    const entries = await db.select().from(libraryTable).where(eq(libraryTable.userId, userId));
    const result = await Promise.all(entries.map(async (entry) => {
      const [song] = await db.select().from(songsTable).where(eq(songsTable.id, entry.songId));
      return { id: entry.id, songId: entry.songId, addedAt: entry.addedAt.toISOString(), song };
    }));
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to get library" });
  }
});

router.post("/", async (req, res) => {
  try {
    const clerkUserId = req.auth?.userId;
    if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });
    const userId = await getDbUserId(clerkUserId);
    const { songId } = req.body;
    const [entry] = await db.insert(libraryTable).values({ userId, songId }).returning();
    const [song] = await db.select().from(songsTable).where(eq(songsTable.id, songId));
    res.status(201).json({ id: entry.id, songId: entry.songId, addedAt: entry.addedAt.toISOString(), song });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to add to library" });
  }
});

router.delete("/:songId", async (req, res) => {
  try {
    const clerkUserId = req.auth?.userId;
    if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });
    const userId = await getDbUserId(clerkUserId);
    const songId = parseInt(req.params.songId);
    await db.delete(libraryTable).where(and(eq(libraryTable.userId, userId), eq(libraryTable.songId, songId)));
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to remove from library" });
  }
});

export default router;