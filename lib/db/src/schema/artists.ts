import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const artists = pgTable("artists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
});
