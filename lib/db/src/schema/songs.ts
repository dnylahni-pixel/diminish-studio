import {
  pgTable,
  serial,
  integer,
  bigint,
  real,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { artists } from "./artists";
import { usersTable } from "./users";

export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),

  artistId: integer("artist_id")
    .references(() => artists.id),

  userId: integer("user_id")
    .references(() => usersTable.id),

  genreId: integer("genre_id"),

  difficulty: text("difficulty").notNull().default("beginner"),
  duration: real("duration"),
  fileKey: text("file_key"),
  fileUrl: text("file_url"),
  status: text("status").notNull().default("pending"),
  mimeType: text("mime_type"),
  fileSize: bigint("file_size", { mode: "number" }).notNull().default(0),
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
