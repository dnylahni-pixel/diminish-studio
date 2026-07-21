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

export async function getUserStorageInfo(
  userId: number,
): Promise<UserStorageInfo> {
  const [row] = await db
    .select({
      storageUsedBytes: usersTable.storageUsedBytes,
      storageQuotaBytes: usersTable.storageQuotaBytes,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  return row ?? { storageUsedBytes: 0, storageQuotaBytes: 0 };
}

/**
 * Atomically increment storage_used_bytes for a user — ONLY if the user has
 * enough remaining quota.  Returns the new storage_used_bytes on success,
 * or null when the quota would be exceeded.
 *
 * This is the deepest enforcement layer: even if the application-layer check
 * is bypassed, the DB WHERE clause guarantees atomic quota enforcement.
 */
export async function incrementStorageUsed(
  userId: number,
  bytes: number,
): Promise<number | null> {
  const [row] = await db
    .update(usersTable)
    .set({
      storageUsedBytes: sql`${usersTable.storageUsedBytes} + ${bytes}`,
    })
    .where(
      sql`${usersTable.id} = ${userId}
        AND ${usersTable.storageUsedBytes} + ${bytes} <= ${usersTable.storageQuotaBytes}`,
    )
    .returning({ storageUsedBytes: usersTable.storageUsedBytes });
  return row?.storageUsedBytes ?? null;
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
