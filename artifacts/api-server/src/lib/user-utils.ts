import { createClerkClient } from "@clerk/backend";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import type { User } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { classifyClerkError, ClerkServiceError } from "./errors";
import { backendConfig } from "../config";

const clerkClient = createClerkClient({
  secretKey: backendConfig.clerk.secretKey,
});

/**
 * Raised when getOrCreateUser fails because of a race condition AND
 * the winning row still cannot be found (should never happen).
 */
export class UserCreationRaceError extends Error {
  constructor(clerkUserId: string) {
    super(
      `Race condition: user with clerk_id '${clerkUserId}' was inserted concurrently but could not be retrieved.`,
    );
    this.name = "UserCreationRaceError";
  }
}

/**
 * Retrieve the local DB user row for a given Clerk user ID.
 *
 * - DB-first: checks the local table before calling Clerk's API.
 * - Auto-create: if the user row does not exist, fetches profile data from
 *   Clerk and INSERTs with ON CONFLICT (clerk_id) DO NOTHING so that
 *   concurrent requests for the same new user do not collide.
 * - Returns a Promise<User>. Throws ClerkServiceError on Clerk failures.
 *
 * @param clerkUserId - the Clerk `userId` from `getAuth(req)`
 */
export async function getOrCreateUser(clerkUserId: string): Promise<User> {
  // 1. Fast path — user already exists
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId));

  if (existing) return existing;

  // 2. Fetch profile from Clerk (only for new users)
  let clerkUser: Awaited<ReturnType<typeof clerkClient.users.getUser>>;
  try {
    clerkUser = await clerkClient.users.getUser(clerkUserId);
  } catch (err: unknown) {
    throw classifyClerkError(err);
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  const username =
    clerkUser.username ?? email?.split("@")[0] ?? `user_${clerkUserId.slice(-8)}`;

  if (!email) {
    throw new ClerkServiceError(
      `Clerk user ${clerkUserId} has no primary email address`,
      "NOT_FOUND" as any,
      null,
    );
  }

  // 3. Insert with ON CONFLICT DO NOTHING to survive races
  const [inserted] = await db
    .insert(usersTable)
    .values({
      clerkId: clerkUserId,
      username,
      email,
      passwordHash: "clerk_managed",
    })
    .onConflictDoNothing({ target: usersTable.clerkId })
    .returning();

  if (inserted) return inserted;

  // 4. Lost the race — re-read the winning row
  const [winner] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId));

  if (!winner) {
    throw new UserCreationRaceError(clerkUserId);
  }

  return winner;
}

/**
 * Serialize a user row to the public API shape.
 * Kept in the shared utility so all routes produce consistent output.
 */
export function serializeUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    preferredInstrument: user.preferredInstrument,
    createdAt: user.createdAt.toISOString(),
  };
}
