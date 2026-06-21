import { Router } from "express";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "@workspace/db";
import { songs, songAnalyses } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const RUNPOD_ENDPOINT = process.env.RUNPOD_ENDPOINT || "";
const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY || "";

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

interface RunPodBeat {
  time: number;
  beat: number;
  measure: number;
  isDownbeat: boolean;
}

interface RunPodChord {
  start: number;
  end: number;
  chord: string;
}

/**
 * POST /songs/:id/analyze
 *
 * Sends song's fileUrl to RunPod for beat + chord extraction,
 * then upserts results into song_analyses.
 */
router.post("/:id/analyze", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid song ID" });
    }

    // 1. Read fileKey from songs table and generate a fresh signed URL
    const [song] = await db
      .select({ fileKey: songs.fileKey })
      .from(songs)
      .where(eq(songs.id, id));

    if (!song) {
      return res.status(404).json({ error: "Song not found" });
    }

    if (!song.fileKey) {
      return res.status(400).json({ error: "Song has no fileKey — cannot analyze" });
    }

    // Generate a fresh signed GET URL so RunPod can download the file
    // Expiry is set to 1 hour (3600s) — sufficient for RunPod to fetch and process
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: song.fileKey,
    });
    const audioUrl = await getSignedUrl(s3Client, getCommand, {
      expiresIn: 3600,
    });

    // 2. Set status to processing
    await db
      .insert(songAnalyses)
      .values({ songId: id, analysisStatus: "processing" })
      .onConflictDoUpdate({
        target: songAnalyses.songId,
        set: { analysisStatus: "processing", updatedAt: new Date() },
      });

    // 3. Call RunPod
    if (!RUNPOD_ENDPOINT || !RUNPOD_API_KEY) {
      // Rollback status
      await db
        .update(songAnalyses)
        .set({ analysisStatus: "error" })
        .where(eq(songAnalyses.songId, id));

      return res.status(500).json({ error: "RunPod not configured (missing env vars)" });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300_000); // 5 min timeout

    let runpodResp: Response;
    try {
      runpodResp = await fetch(RUNPOD_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RUNPOD_API_KEY}`,
        },
        body: JSON.stringify({
          input: { audio_url: audioUrl },
        }),
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(timeout);
      await db
        .update(songAnalyses)
        .set({ analysisStatus: "error" })
        .where(eq(songAnalyses.songId, id));

      if (err.name === "AbortError") {
        return res.status(504).json({ error: "RunPod request timed out" });
      }
      return res.status(502).json({ error: `RunPod request failed: ${err.message}` });
    }

    clearTimeout(timeout);

    if (!runpodResp.ok) {
      await db
        .update(songAnalyses)
        .set({ analysisStatus: "error" })
        .where(eq(songAnalyses.songId, id));

      const text = await runpodResp.text().catch(() => "");
      return res.status(502).json({ error: `RunPod returned ${runpodResp.status}: ${text}` });
    }

    const payload = await runpodResp.json() as any;

    // RunPod wraps results in `output`
    const output = payload?.output ?? payload;

    // 4. Extract results
    const beats: RunPodBeat[] = output?.beats ?? [];
    const chords: RunPodChord[] = output?.chords ?? [];

    // Transform beats → beatTimeline
    const beatTimeline = beats.map((b) => ({
      time: b.time,
      beat: b.beat,
      measure: b.measure,
      isDownbeat: b.isDownbeat,
    }));

    // Transform chords → chordTimeline
    // Map each chord's time range to beats in beatTimeline so frontend gets { measure, beat, chord, time }
    const chordTimeline: Array<{ measure: number; beat: number; chord: string; time: number }> = [];

    for (const ch of chords) {
      // Find beats whose time falls within [ch.start, ch.end)
                  const ownerBeat = beatTimeline.reduce((closest, b) => {
        if (!closest) return b;
        return Math.abs(b.time - ch.start) < Math.abs(closest.time - ch.start) ? b : closest;
      }, null as (typeof beatTimeline)[number] | null);
      const covered = ownerBeat ? [ownerBeat] : [];

      if (covered.length > 0) {
        for (const b of covered) {
          chordTimeline.push({
            measure: b.measure,
            beat: b.beat,
            chord: ch.chord,
            time: b.time,
          });
        }
      } else {
        // Should not happen unless beatTimeline is empty
        const nextBeat = beatTimeline[0];
        if (nextBeat) {
          chordTimeline.push({
            measure: nextBeat.measure,
            beat: nextBeat.beat,
            chord: ch.chord,
            time: nextBeat.time,
          });
        }
      }
    }

    // 5. Upsert into song_analyses
    await db
      .insert(songAnalyses)
      .values({
        songId: id,
        beatTimeline,
        chordTimeline,
        analysisStatus: "completed",
        analysisVersion: "1",
      })
      .onConflictDoUpdate({
        target: songAnalyses.songId,
        set: {
          beatTimeline,
          chordTimeline,
          analysisStatus: "completed",
          analysisVersion: "1",
          updatedAt: new Date(),
        },
      });

    return res.json({
      songId: id,
      status: "completed",
      beatCount: beatTimeline.length,
      chordCount: chordTimeline.length,
    });
  } catch (err: any) {
    console.error("Analyze error:", err);

    // Try to mark as error
    try {
      const id = parseInt(req.params.id);
      if (!isNaN(id)) {
        await db
          .update(songAnalyses)
          .set({ analysisStatus: "error" })
          .where(eq(songAnalyses.songId, id));
      }
    } catch {}

    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;