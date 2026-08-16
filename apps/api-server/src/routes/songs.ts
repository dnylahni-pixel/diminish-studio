import { Router } from "express";
import { db } from "@workspace/db";
import { songs, artists } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { findUserByClerkId } from "../lib/user-utils";
import { sendError } from "../lib/http-errors";
import { getRuntimeConfig } from "../lib/runtime-config";

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

    return res.json(result.map(s => ({
      ...s,
      key: s.musicalKey,
    })));
  } catch (e) {
    console.error(e);
    return sendError(res, 500, "SONG_LIST_FAILED", "Failed to list songs");
  }
});

router.get("/featured", async (req, res) => {
  try {
    const runtimeConfig = await getRuntimeConfig();
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
      .limit(runtimeConfig.settings.songs.featuredCount);

    return res.json(result.map(s => ({
      ...s,
      key: s.musicalKey,
    })));
  } catch (e) {
    console.error(e);
    return sendError(
      res,
      500,
      "FEATURED_SONGS_READ_FAILED",
      "Failed to get featured songs",
    );
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return sendError(res, 400, "INVALID_SONG_ID", "Invalid song ID");
    }
    
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
        status: songs.status,
        userId: songs.userId,
        createdAt: songs.createdAt,
        updatedAt: songs.updatedAt,
      })
      .from(songs)
      .leftJoin(artists, eq(songs.artistId, artists.id))
      .where(eq(songs.id, id));

    if (!result) {
      return sendError(res, 404, "SONG_NOT_FOUND", "Song not found");
    }

    if (result.status !== "published") {
      const { userId } = getAuth(req);
      const currentUser = userId ? await findUserByClerkId(userId) : null;

      if (!currentUser || result.userId !== currentUser.id) {
        return sendError(res, 404, "SONG_NOT_FOUND", "Song not found");
      }
    }

    const { userId: _ownerId, ...song } = result;
    
    return res.json({
      ...song,
      key: result.musicalKey,
    });
  } catch (e) {
    console.error(e);
    return sendError(res, 500, "SONG_READ_FAILED", "Failed to get song");
  }
});

export default router;
