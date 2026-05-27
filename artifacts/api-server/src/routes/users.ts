import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, libraryTable, songsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

// Stub auth: use userId=1 for demo
const DEMO_USER_ID = 1;

router.get("/me", async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      preferredInstrument: user.preferredInstrument,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to get user" });
  }
});

router.patch("/me", async (req, res) => {
  try {
    const { username, bio, preferredInstrument } = req.body;
    const [user] = await db.update(usersTable)
      .set({ username, bio, preferredInstrument })
      .where(eq(usersTable.id, DEMO_USER_ID))
      .returning();
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      preferredInstrument: user.preferredInstrument,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const [user] = await db.insert(usersTable).values({
      username,
      email,
      passwordHash: `hashed_${password}`,
    }).returning();
    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: null,
      bio: null,
      preferredInstrument: null,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to register" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email } = req.body;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      preferredInstrument: user.preferredInstrument,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to login" });
  }
});

export default router;
