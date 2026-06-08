import { pgTable, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { songsTable } from "./songs";

export const songAnalyses = pgTable("song_analyses", {
  songId: integer("song_id")
    .primaryKey()
    .references(() => songs.id, { onDelete: "cascade" }),

  lyricsTimeline: jsonb("lyrics_timeline"),
  chordTimeline: jsonb("chord_timeline"),
  beatTimeline: jsonb("beat_timeline"),
  sectionsTimeline: jsonb("sections_timeline"),
  tempoTimeline: jsonb("tempo_timeline"),
  keyTimeline: jsonb("key_timeline"),
  tracks: jsonb("tracks"),

  analysisStatus: text("analysis_status").notNull().default("pending"),
  analysisVersion: text("analysis_version"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
