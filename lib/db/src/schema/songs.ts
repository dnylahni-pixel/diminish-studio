import {
  pgTable,
  serial,
  integer,
  real,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { artists } from "./artists";

export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),

  artistId: integer("artist_id")
    .notNull()
    .references(() => artists.id),

  genreId: integer("genre_id"),

  difficulty: text("difficulty").notNull().default("beginner"),
  duration: real("duration"),
  bpm: real("bpm"),
  musicalKey: text("musical_key"),
  mode: text("mode"),
  timeSignature: text("time_signature"),

  coverUrl: text("cover_url"),
  playCount: integer("play_count").notNull().default(0),
  featured: boolean("featured").notNull().default(false),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
