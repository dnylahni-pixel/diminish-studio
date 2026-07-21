import { db } from "@workspace/db";
import { songs, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

export async function getDbUserId(clerkUserId: string): Promise<number | null> {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId));
  return user?.id ?? null;
}

export interface UserStorageInfo {
  storageUsedBytes: number;
  storageQuotaBytes: number;
}

/**
 * Calculate storage used by summing songs.file_size for a user.
 * This is the single source of truth — always reflects actual files on disk.
 */
export async function getStorageQuota(
  userId: number,
): Promise<UserStorageInfo> {
  const [row] = await db
    .select({
      storageUsedBytes: sql<number>`COALESCE(SUM(${songs.fileSize}), 0)::bigint`,
      storageQuotaBytes: usersTable.storageQuotaBytes,
    })
    .from(usersTable)
    .leftJoin(songs, eq(songs.userId, usersTable.id))
    .where(eq(usersTable.id, userId))
    .groupBy(usersTable.id);
  
  return {
    storageUsedBytes: row?.storageUsedBytes ?? 0,
    storageQuotaBytes: row?.storageQuotaBytes ?? 0,
  };
}

export async function insertSong(values: {
  title: string;
  fileKey: string;
  fileUrl: string;
  status: string;
  duration: number;
  mimeType: string;
  fileSize: number;
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
      fileSize: values.fileSize,
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
