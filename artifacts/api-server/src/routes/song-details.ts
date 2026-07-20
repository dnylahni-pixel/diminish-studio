import { Router } from "express";
import { db } from "@workspace/db";
import { songs, artists, songAnalyses, songStems } from "@workspace/db";
import { eq } from "drizzle-orm";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

/**
 * GET /song-details/:id
 * 
 * Returns comprehensive song data including:
 * - Basic song metadata (title, artist, duration, bpm, key, timeSignature)
 * - Full analysis data (beatGrid, chords, lyrics, sections, tempo, key changes)
 * - All stem tracks with URLs and metadata
 * - Versioning information for cache invalidation
 * 
 * Response format matches the WebAudioEngine architecture requirements:
 * - Single time reference (MasterTransport compatible)
 * - Beat grid with precise timestamps and downbeat markers
 * - Chord timeline synced to beat grid
 * - Lyrics with word-level timing for karaoke display
 * - Section markers for A/B loop functionality
 * - Track metadata for stem player configuration
 */
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid song ID" });
    }

    // Fetch base song data with artist
    const [songData] = await db
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
        fileKey: songs.fileKey,
        createdAt: songs.createdAt,
        updatedAt: songs.updatedAt,
      })
      .from(songs)
      .leftJoin(artists, eq(songs.artistId, artists.id))
      .where(eq(songs.id, id));

    if (!songData) {
      return res.status(404).json({ error: "Song not found" });
    }

    // Fetch analysis data
    const [analysis] = await db
      .select()
      .from(songAnalyses)
      .where(eq(songAnalyses.songId, id));

    // Fetch stems data
    const [stems] = await db
      .select()
      .from(songStems)
      .where(eq(songStems.songId, id));

    // Parse timeSignature string (e.g., "4/4") into structured object
    let timeSignature = { numerator: 4, denominator: 4 };
    if (songData.timeSignature) {
      const parts = songData.timeSignature.split("/");
      if (parts.length === 2) {
        timeSignature = {
          numerator: parseInt(parts[0]) || 4,
          denominator: parseInt(parts[1]) || 4,
        };
      }
    }

    // Build tracks array from stems
    const tracks = [];
    if (stems) {
      const stemMapping = [
        { id: 1, instrument: "drums", label: "Drums", url: stems.drumsUrl },
        { id: 2, instrument: "bass", label: "Bass", url: stems.bassUrl },
        { id: 3, instrument: "guitar", label: "Guitar", url: stems.guitarUrl },
        { id: 4, instrument: "piano", label: "Piano", url: stems.pianoUrl },
        { id: 5, instrument: "vocal", label: "Vocals", url: stems.vocalUrl },
        { id: 6, instrument: "other", label: "Other", url: stems.otherUrl },
      ];

      for (const stem of stemMapping) {
        if (stem.url) {
          tracks.push({
            id: stem.id,
            instrument: stem.instrument,
            label: stem.label,
            volume: 80,
            muted: false,
            soloable: true,
            pan: 0,
            streamUrl: stem.url,
            offset: 0.0,
            normalizationGain: 1.0,
            peaks: null, // Will be populated by processing pipeline
          });
        }
      }
    }

    // Generate fresh signed URL for master track (never expires in DB)
    let masterStreamUrl: string | null = null;
    if (songData.fileKey) {
      masterStreamUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: songData.fileKey,
        }),
        { expiresIn: 900 },
      );
    }

    // Add master track with fresh signed URL
    if (masterStreamUrl) {
      tracks.unshift({
        id: 0,
        instrument: "master",
        label: "Master",
        volume: 100,
        muted: false,
        soloable: false,
        pan: 0,
        streamUrl: masterStreamUrl,
        offset: 0.0,
        normalizationGain: 1.0,
        peaks: null,
      });
    }

    // Construct comprehensive response
    const response = {
      // Basic metadata
      id: songData.id,
      title: songData.title,
      artist: songData.artist,
      artistId: songData.artistId,
      coverUrl: songData.coverUrl,
      difficulty: songData.difficulty,
      
      // Musical properties
      duration: songData.duration,
      bpm: songData.bpm,
      key: songData.musicalKey,
      mode: songData.mode,
      timeSignature,

      // Versioning for cache invalidation
      version: analysis?.analysisVersion || null,
      analysisStatus: analysis?.analysisStatus || "pending",
      generatedAt: analysis?.updatedAt?.toISOString() || null,

      // Timeline data (parsed from JSONB)
      beatGrid: analysis?.beatTimeline || [],
      chordTimeline: analysis?.chordTimeline || [],
      lyrics: analysis?.lyricsTimeline || [],
      sections: analysis?.sectionsTimeline || [],
      tempoTimeline: analysis?.tempoTimeline || [],
      keyTimeline: analysis?.keyTimeline || [],

      // Tracks with stems
      tracks,

      // Master track URL — fresh signed URL (expiresIn 900s)
      masterTrackUrl: masterStreamUrl,

      // Metadata
      playCount: songData.playCount,
      featured: songData.featured,
      createdAt: songData.createdAt.toISOString(),
      updatedAt: songData.updatedAt.toISOString(),
    };

    return res.json(response);
  } catch (error) {
    console.error("Error fetching song details:", error);
    return res.status(500).json({ 
      error: "Failed to fetch song details",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
