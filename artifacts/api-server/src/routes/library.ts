import { Router } from "express";
import { db } from "@workspace/db";
import { libraryTable, songsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

const DEMO_USER_ID = 1;

router.get("/", async (req, res) => {
  try {
    const entries = await db.select().from(libraryTable).where(eq(libraryTable.userId, DEMO_USER_ID));
    const result = await Promise.all(entries.map(async (entry) => {
      const [song] = await db.select().from(songsTable).where(eq(songsTable.id, entry.songId));
      return {
        id: entry.id,
        songId: entry.songId,
        addedAt: entry.addedAt.toISOString(),
        song,
      };
    }));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: "Failed to get library" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { songId } = req.body;
    const [entry] = await db.insert(libraryTable).values({
      userId: DEMO_USER_ID,
      songId,
    }).returning();
    const [song] = await db.select().from(songsTable).where(eq(songsTable.id, songId));
    res.status(201).json({
      id: entry.id,
      songId: entry.songId,
      addedAt: entry.addedAt.toISOString(),
      song,
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to add to library" });
  }
});

router.delete("/:songId", async (req, res) => {
  try {
    const songId = parseInt(req.params.songId);
    await db.delete(libraryTable).where(
      and(eq(libraryTable.userId, DEMO_USER_ID), eq(libraryTable.songId, songId))
    );
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: "Failed to remove from library" });
  }
});

export default router;
