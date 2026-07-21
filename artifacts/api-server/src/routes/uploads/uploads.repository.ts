import { db } from "@workspace/db";
import { songs, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function getDbUserId(clerkUserId: string): Promise<number | null> {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId));
  return user?.id ?? null;
}

export async function insertSong(values: {
  title: string;
  fileKey: string;
  fileUrl: string;
  status: string;
  duration: number;
  mimeType: string;
  userId: number;
}) {
  return db
    .insert(songs)
    .values({
      title: values.title,
      fileKey: values.fileKey,
      fileUrl: values.fileUrl,
      status: values.status,
      duration: values.duration,
      mimeType: values.mimeType,
      userId: values.userId,
    })
    .returning({ id: songs.id });
}

export async function finalizeSong(songId: number, values: {
  fileKey: string;
  fileUrl: string;
  status: string;
}) {
  return db
    .update(songs)
    .set(values)
    .where(eq(songs.id, songId));
}