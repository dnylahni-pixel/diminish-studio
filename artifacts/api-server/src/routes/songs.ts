import { Router } from "express";
import { db } from "@workspace/db";
import { songs, artists } from "@workspace/db";
import { eq, and, like, or } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { search } = req.query as { search?: string };
    
    let query = db
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
        createdAt: songs.createdAt,
        updatedAt: songs.updatedAt,
      })
      .from(songs)
      .leftJoin(artists, eq(songs.artistId, artists.id))
      .where(eq(songs.status, "published"));

    let result = await query;

    if (search) {
      const q = `%${search.toLowerCase()}%`;
      result = result.filter(s => 
        s.title.toLowerCase().includes(search.toLowerCase()) || 
        s.artist?.toLowerCase().includes(search.toLowerCase())
      );
    }

    res.json(result.map(s => ({
      ...s,
      key: s.musicalKey,
    })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to list songs" });
  }
});

router.get("/featured", async (req, res) => {
  try {
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
        createdAt: songs.createdAt,
        updatedAt: songs.updatedAt,
      })
      .from(songs)
      .leftJoin(artists, eq(songs.artistId, artists.id))
      .where(eq(songs.featured, true))
      .limit(8);

    res.json(result.map(s => ({
      ...s,
      key: s.musicalKey,
    })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to get featured songs" });
  }
});

/*
router.get("/process/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const [job] = await db.select().from(processingJobsTable).where(eq(processingJobsTable.jobId, jobId));
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json({
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      songId: job.songId,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt.toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to get job" });
  }
});

router.post("/process", async (req, res) => {
  try {
    const { source, title, artist } = req.body;
    const jobId = randomUUID();
    const [job] = await db.insert(processingJobsTable).values({
      jobId,
      source,
      title: title ?? null,
      artist: artist ?? null,
      status: "queued",
      progress: 0,
    }).returning();

    // Simulate processing stages in background
    const stages: Array<{ status: string; progress: number; delay: number }> = [
      { status: "analyzing", progress: 15, delay: 2000 },
      { status: "extracting_chords", progress: 40, delay: 4000 },
      { status: "syncing_lyrics", progress: 65, delay: 6000 },
      { status: "finalizing", progress: 85, delay: 8000 },
      { status: "done", progress: 100, delay: 10000 },
    ];

    for (const stage of stages) {
      setTimeout(async () => {
        await db.update(processingJobsTable)
          .set({ status: stage.status, progress: stage.progress })
          .where(eq(processingJobsTable.jobId, jobId));
      }, stage.delay);
    }

    res.status(202).json({
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      songId: null,
      errorMessage: null,
      createdAt: job.createdAt.toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to start processing" });
  }
});

*/

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    
    const [result] = await db
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
        createdAt: songs.createdAt,
        updatedAt: songs.updatedAt,
      })
      .from(songs)
      .leftJoin(artists, eq(songs.artistId, artists.id))
      .where(eq(songs.id, id));

    if (!result) return res.status(404).json({ error: "Song not found" });
    
    res.json({
      ...result,
      key: result.musicalKey,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to get song" });
  }
});

export default router;
