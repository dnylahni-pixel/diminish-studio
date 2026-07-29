import { Router } from "express";
import { db } from "@workspace/db";
import { learningSessionsTable, chordAttemptsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { sendError } from "../lib/http-errors";

const router = Router();

const DEMO_USER_ID = 1;

router.get("/sessions", async (req, res) => {
  try {
    const sessions = await db.select().from(learningSessionsTable).where(eq(learningSessionsTable.userId, DEMO_USER_ID));
    return res.json(sessions.map(s => ({
      ...s,
      startedAt: s.startedAt.toISOString(),
    })));
  } catch (e) {
    return sendError(
      res,
      500,
      "LEARNING_SESSIONS_READ_FAILED",
      "Failed to get sessions",
    );
  }
});

router.post("/sessions", async (req, res) => {
  try {
    const { chordName, instrument } = req.body;
    const [session] = await db.insert(learningSessionsTable).values({
      userId: DEMO_USER_ID,
      chordName,
      instrument: instrument ?? "guitar",
      attemptsCount: 0,
      successCount: 0,
      mastered: false,
    }).returning();
    return res.status(201).json({
      ...session,
      startedAt: session.startedAt.toISOString(),
    });
  } catch (e) {
    return sendError(
      res,
      500,
      "LEARNING_SESSION_CREATE_FAILED",
      "Failed to create session",
    );
  }
});

router.post("/sessions/:id/attempt", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { success, confidenceScore } = req.body;

    // Insert attempt
    const [attempt] = await db.insert(chordAttemptsTable).values({
      sessionId: id,
      success,
      confidenceScore,
    }).returning();

    // Update session counts
    const [session] = await db.select().from(learningSessionsTable).where(eq(learningSessionsTable.id, id));
    const newAttempts = (session?.attemptsCount ?? 0) + 1;
    const newSuccess = (session?.successCount ?? 0) + (success ? 1 : 0);
    const mastered = newAttempts >= 5 && (newSuccess / newAttempts) >= 0.8;

    await db.update(learningSessionsTable).set({
      attemptsCount: newAttempts,
      successCount: newSuccess,
      mastered,
    }).where(eq(learningSessionsTable.id, id));

    return res.json({
      ...attempt,
      attemptedAt: attempt.attemptedAt.toISOString(),
    });
  } catch (e) {
    return sendError(
      res,
      500,
      "LEARNING_ATTEMPT_CREATE_FAILED",
      "Failed to submit attempt",
    );
  }
});

router.get("/mastered-chords", async (req, res) => {
  try {
    const sessions = await db.select().from(learningSessionsTable).where(
      and(eq(learningSessionsTable.userId, DEMO_USER_ID), eq(learningSessionsTable.mastered, true))
    );
    const result = sessions.map(s => ({
      chordName: s.chordName,
      instrument: s.instrument,
      masteredAt: s.startedAt.toISOString(),
      totalAttempts: s.attemptsCount,
      successRate: s.attemptsCount > 0 ? s.successCount / s.attemptsCount : 0,
    }));
    return res.json(result);
  } catch (e) {
    return sendError(
      res,
      500,
      "MASTERED_CHORDS_READ_FAILED",
      "Failed to get mastered chords",
    );
  }
});

export default router;
