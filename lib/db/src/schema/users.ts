import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").unique(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  preferredInstrument: text("preferred_instrument"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const libraryTable = pgTable("library", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  songId: integer("song_id").notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const insertLibrarySchema = createInsertSchema(libraryTable).omit({ id: true, addedAt: true });
export type InsertLibrary = z.infer<typeof insertLibrarySchema>;
export type Library = typeof libraryTable.$inferSelect;
