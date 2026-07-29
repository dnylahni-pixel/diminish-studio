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
import { sendError } from "../lib/http-errors";

const router = Router();

/** Map a ClerkServiceError into a response-contract shape */
function clerkErrorToResponse(err: ClerkServiceError) {
  switch (err.kind) {
    case ClerkErrorKind.NotFound:
      return {
        status: 401,
        body: { error: "Invalid session", code: "INVALID_SESSION" },
      };
    case ClerkErrorKind.RateLimited:
      return {
        status: 429,
        body: {
          error: "Authentication service busy",
          code: "AUTH_RATE_LIMITED",
          retryAfterSeconds: 60,
        },
      };
    case ClerkErrorKind.Unavailable:
    default:
      return {
        status: 502,
        body: {
          error: "Authentication service unavailable",
          code: "AUTH_SERVICE_UNAVAILABLE",
        },
      };
  }
}

router.get("/me", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return sendError(res, 401, "UNAUTHORIZED", "Unauthorized");
    }
    const user = await getOrCreateUser(userId);
    return res.json(serializeUser(user));
  } catch (e) {
    if (e instanceof ClerkServiceError) {
      const { status, body } = clerkErrorToResponse(e);
      return res.status(status).json(body);
    }
    console.error(e);
    return sendError(res, 500, "USER_READ_FAILED", "Failed to get user");
  }
});

router.patch("/me", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return sendError(res, 401, "UNAUTHORIZED", "Unauthorized");
    }
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
    return sendError(res, 500, "USER_UPDATE_FAILED", "Failed to update user");
  }
});

export default router;
