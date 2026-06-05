import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { createClerkClient } from "@clerk/backend";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

async function getOrCreateUser(clerkUserId: string) {
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkUserId));
  if (existing) return existing;

  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const email = clerkUser.emailAddresses[0]?.emailAddress;
  const username = clerkUser.username || email?.split("@")[0] || `user_${clerkUserId.slice(-8)}`;

  if (!email) throw new Error("No email");

  const [newUser] = await db.insert(usersTable).values({
    clerkId: clerkUserId,
    username,
    email,
    passwordHash: "clerk_managed",
  }).returning();

  return newUser;
}

function serializeUser(user: typeof usersTable.$inferSelect) {
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

router.get("/me", requireAuth(), async (req, res) => {
  try {
    const clerkUserId = req.auth?.userId;
    if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });
    const user = await getOrCreateUser(clerkUserId);
    return res.json(serializeUser(user));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to get user" });
  }
});

router.patch("/me", requireAuth(), async (req, res) => {
  try {
    const clerkUserId = req.auth?.userId;
    if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });
    const user = await getOrCreateUser(clerkUserId);
    const { username, bio, preferredInstrument } = req.body;
    const [updated] = await db.update(usersTable).set({ username, bio, preferredInstrument }).where(eq(usersTable.id, user.id)).returning();
    return res.json(serializeUser(updated));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to update user" });
  }
});

router.post("/register", async (req, res) => res.status(400).json({ error: "Use Clerk sign-up" }));
router.post("/login", async (req, res) => res.status(400).json({ error: "Use Clerk sign-in" }));

export default router;