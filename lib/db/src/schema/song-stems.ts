import { pgTable, integer, text, timestamp } from "drizzle-orm/pg-core";
import { songs } from "./songs";

export const songStems = pgTable("song_stems", {
  songId: integer("song_id")
    .primaryKey()
    .references(() => songs.id, { onDelete: "cascade" }),

  audioUrl: text("audio_url"),
  vocalUrl: text("vocal_url"),
  instrumentalUrl: text("instrumental_url"),
  drumsUrl: text("drums_url"),
  bassUrl: text("bass_url"),
  pianoUrl: text("piano_url"),
  guitarUrl: text("guitar_url"),
  otherUrl: text("other_url"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
