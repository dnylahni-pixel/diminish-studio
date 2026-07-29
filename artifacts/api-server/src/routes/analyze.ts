import { Router } from "express";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "@workspace/db";
import { songs, songAnalyses } from "@workspace/db";
import { eq } from "drizzle-orm";
import { backendConfig } from "../config";
import { getAuth } from "@clerk/express";
import { findUserByClerkId } from "../lib/user-utils";
import { sendError } from "../lib/http-errors";

const router = Router();

const s3Client = new S3Client({
  endpoint: backendConfig.b2.endpoint,
  region: backendConfig.b2.region,
  credentials: {
    accessKeyId: backendConfig.b2.keyId,
    secretAccessKey: backendConfig.b2.applicationKey,
  },
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

const BUCKET_NAME = backendConfig.b2.bucketName;

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
    const { userId } = getAuth(req);
    if (!userId) {
      return sendError(res, 401, "UNAUTHORIZED", "Unauthorized");
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return sendError(res, 400, "INVALID_SONG_ID", "Invalid song ID");
    }

    // 1. Read fileKey from songs table and generate a fresh signed URL
    const [song] = await db
      .select({ fileKey: songs.fileKey, userId: songs.userId })
      .from(songs)
      .where(eq(songs.id, id));

    if (!song) {
      return sendError(res, 404, "SONG_NOT_FOUND", "Song not found");
    }

    const currentUser = await findUserByClerkId(userId);
    if (!currentUser || song.userId !== currentUser.id) {
      return sendError(res, 404, "SONG_NOT_FOUND", "Song not found");
    }

    if (!song.fileKey) {
      return sendError(
        res,
        409,
        "SONG_FILE_UNAVAILABLE",
        "Song file is unavailable for analysis",
      );
    }

    if (!backendConfig.runPod) {
      return sendError(
        res,
        503,
        "ANALYSIS_UNAVAILABLE",
        "Analysis service is not configured",
      );
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300_000); // 5 min timeout

    let runpodResp: Response;
    try {
      runpodResp = await fetch(backendConfig.runPod.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${backendConfig.runPod.apiKey}`,
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
        return sendError(
          res,
          504,
          "ANALYSIS_TIMEOUT",
          "Analysis request timed out",
        );
      }
      return sendError(
        res,
        502,
        "ANALYSIS_PROVIDER_UNAVAILABLE",
        "Analysis provider request failed",
      );
    }

    clearTimeout(timeout);

    if (!runpodResp.ok) {
      await db
        .update(songAnalyses)
        .set({ analysisStatus: "error" })
        .where(eq(songAnalyses.songId, id));

      await runpodResp.body?.cancel().catch(() => {});
      return sendError(
        res,
        502,
        "ANALYSIS_PROVIDER_ERROR",
        "Analysis provider returned an error",
      );
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

    return sendError(
      res,
      500,
      "ANALYSIS_FAILED",
      "Failed to analyze song",
    );
  }
});

export default router;
