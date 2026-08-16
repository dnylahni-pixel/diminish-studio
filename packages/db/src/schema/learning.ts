import { pgTable, text, serial, timestamp, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const chordsTable = pgTable("chords", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  instrument: text("instrument").notNull().default("guitar"),
  difficulty: text("difficulty").notNull().default("beginner"),
  fingers: text("fingers").array().notNull().default([]),
  strings: text("strings").array().notNull().default([]),
  description: text("description"),
  audioUrl: text("audio_url"),
});

export const insertChordSchema = createInsertSchema(chordsTable).omit({ id: true });
export type InsertChord = z.infer<typeof insertChordSchema>;
export type Chord = typeof chordsTable.$inferSelect;

export const learningSessionsTable = pgTable("learning_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  chordName: text("chord_name").notNull(),
  instrument: text("instrument").notNull().default("guitar"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  attemptsCount: integer("attempts_count").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  mastered: boolean("mastered").notNull().default(false),
});

export const insertLearningSessionSchema = createInsertSchema(learningSessionsTable).omit({ id: true, startedAt: true });
export type InsertLearningSession = z.infer<typeof insertLearningSessionSchema>;
export type LearningSession = typeof learningSessionsTable.$inferSelect;

export const chordAttemptsTable = pgTable("chord_attempts", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => learningSessionsTable.id),
  success: boolean("success").notNull(),
  confidenceScore: real("confidence_score").notNull().default(0),
  attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
});

export const insertChordAttemptSchema = createInsertSchema(chordAttemptsTable).omit({ id: true, attemptedAt: true });
export type InsertChordAttempt = z.infer<typeof insertChordAttemptSchema>;
export type ChordAttempt = typeof chordAttemptsTable.$inferSelect;
