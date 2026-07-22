declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        sessionId: string;
      };
    }
  }
}

import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getOrCreateUser, serializeUser } from "../lib/user-utils";
import { ClerkServiceError, ClerkErrorKind } from "../lib/errors";

const router = Router();

/** Map a ClerkServiceError into a response-contract shape */
function clerkErrorToResponse(err: ClerkServiceError) {
  switch (err.kind) {
    case ClerkErrorKind.NotFound:
      return { status: 401, body: { error: "Invalid session" } };
    case ClerkErrorKind.RateLimited:
      return {
        status: 429,
        body: {
          error: "Authentication service busy",
          retryAfterSeconds: 60,
        },
      };
    case ClerkErrorKind.Unavailable:
    default:
      return {
        status: 502,
        body: { error: "Authentication service unavailable" },
      };
  }
}

router.get("/me", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const user = await getOrCreateUser(userId);
    return res.json(serializeUser(user));
  } catch (e) {
    if (e instanceof ClerkServiceError) {
      const { status, body } = clerkErrorToResponse(e);
      return res.status(status).json(body);
    }
    console.error(e);
    return res.status(500).json({ error: "Failed to get user" });
  }
});

router.patch("/me", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const user = await getOrCreateUser(userId);
    const { username, bio, preferredInstrument } = req.body;
    const [updated] = await db
      .update(usersTable)
      .set({ username, bio, preferredInstrument })
      .where(eq(usersTable.id, user.id))
      .returning();
    return res.json(serializeUser(updated));
  } catch (e) {
    if (e instanceof ClerkServiceError) {
      const { status, body } = clerkErrorToResponse(e);
      return res.status(status).json(body);
    }
    console.error(e);
    return res.status(500).json({ error: "Failed to update user" });
  }
});

router.post("/register", async (req, res) =>
  res.status(400).json({ error: "Use Clerk sign-up" }),
);
router.post("/login", async (req, res) =>
  res.status(400).json({ error: "Use Clerk sign-in" }),
);

export default router;