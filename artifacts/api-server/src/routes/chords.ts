import { Router } from "express";
import { db } from "@workspace/db";
import { chordsTable, learningSessionsTable, chordAttemptsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { sendError } from "../lib/http-errors";

const router = Router();

const DEMO_USER_ID = 1;

router.get("/", async (req, res) => {
  try {
    const { instrument, difficulty } = req.query as { instrument?: string; difficulty?: string };
    let chords = await db.select().from(chordsTable);
    if (instrument) chords = chords.filter(c => c.instrument === instrument);
    if (difficulty) chords = chords.filter(c => c.difficulty === difficulty);
    return res.json(chords.map(c => ({
      ...c,
      fingers: c.fingers.map(Number),
      strings: c.strings.map(Number),
    })));
  } catch (e) {
    return sendError(res, 500, "CHORD_LIST_FAILED", "Failed to list chords");
  }
});

router.get("/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const [chord] = await db.select().from(chordsTable).where(eq(chordsTable.name, name));
    if (!chord) {
      return sendError(res, 404, "CHORD_NOT_FOUND", "Chord not found");
    }
    return res.json({ ...chord, fingers: chord.fingers.map(Number), strings: chord.strings.map(Number) });
  } catch (e) {
    return sendError(res, 500, "CHORD_READ_FAILED", "Failed to get chord");
  }
});

export default router;
