import { pgTable, text, serial, timestamp, integer, boolean, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const songsTable = pgTable("songs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  genre: text("genre").notNull().default("Unknown"),
  duration: integer("duration").notNull().default(0),
  coverUrl: text("cover_url"),
  bpm: integer("bpm").notNull().default(120),
  key: text("key").notNull().default("C"),
  difficulty: text("difficulty").notNull().default("beginner"),
  playCount: integer("play_count").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  lyrics: jsonb("lyrics").default([]),
  chordTimeline: jsonb("chord_timeline").default([]),
  tracks: jsonb("tracks").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSongSchema = createInsertSchema(songsTable).omit({ id: true, createdAt: true });
export type InsertSong = z.infer<typeof insertSongSchema>;
export type Song = typeof songsTable.$inferSelect;

export const processingJobsTable = pgTable("processing_jobs", {
  id: serial("id").primaryKey(),
  jobId: text("job_id").notNull().unique(),
  source: text("source").notNull(),
  title: text("title"),
  artist: text("artist"),
  status: text("status").notNull().default("queued"),
  progress: integer("progress").notNull().default(0),
  songId: integer("song_id"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProcessingJobSchema = createInsertSchema(processingJobsTable).omit({ id: true, createdAt: true });
export type InsertProcessingJob = z.infer<typeof insertProcessingJobSchema>;
export type ProcessingJob = typeof processingJobsTable.$inferSelect;
