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
 * Read storage info directly from the materialized counter on the users table.
 * This is the fast path — O(1) single-row read.
 */
export async function getStorageQuota(
  userId: number,
): Promise<UserStorageInfo> {
  const [row] = await db
    .select({
      storageUsedBytes: usersTable.storageUsedBytes,
      storageQuotaBytes: usersTable.storageQuotaBytes,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  return {
    storageUsedBytes: row?.storageUsedBytes ?? 0,
    storageQuotaBytes: row?.storageQuotaBytes ?? 0,
  };
}

/**
 * Atomic increment of the storage counter.
 * Uses a SQL-level check (storage_quota_bytes >= storage_used_bytes + bytes)
 * so that concurrent uploads cannot race past the quota.
 * Returns the updated row count (1 = success, 0 = quota would be exceeded).
 */
export async function incrementStorageUsed(
  userId: number,
  bytes: number,
): Promise<boolean> {
  const result = await db.execute(
    sql`UPDATE users
        SET storage_used_bytes = storage_used_bytes + ${bytes}::bigint
        WHERE id = ${userId}
          AND storage_quota_bytes >= (storage_used_bytes + ${bytes}::bigint)
        RETURNING id`,
  );
  return (result.rowCount ?? 0) > 0;
}

/**
 * Decrement the storage counter when a song is deleted.
 * Guards against going below zero.
 */
export async function decrementStorageUsed(
  userId: number,
  bytes: number,
): Promise<void> {
  await db.execute(
    sql`UPDATE users
        SET storage_used_bytes = GREATEST(0, storage_used_bytes - ${bytes}::bigint)
        WHERE id = ${userId}`,
  );
}

/**
 * Reconcile the materialized counter with the actual sum of song file sizes.
 * Call this from a cron job or admin endpoint to fix drift.
 */
export async function reconcileStorageUsed(
  userId: number,
): Promise<number> {
  await db.execute(
    sql`UPDATE users u
        SET storage_used_bytes = COALESCE(
          (SELECT SUM(s.file_size) FROM songs s WHERE s.user_id = u.id), 0
        )
        WHERE u.id = ${userId}`,
  );
  const [row] = await db
    .select({ storageUsedBytes: usersTable.storageUsedBytes })
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  return row?.storageUsedBytes ?? 0;
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
