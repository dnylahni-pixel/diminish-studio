import { Router } from "express";
import { getAuth } from "@clerk/express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@workspace/db";
import { songs, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const ALLOWED_MIME_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/flac",
  "audio/mp4",
  "audio/ogg",
] as const;

const MAX_FILE_SIZE = 104_857_600; // 100MB

const bodySchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
  duration: z.number().positive(),
});

const s3Client = new S3Client({
  endpoint: process.env["B2_ENDPOINT"],
  region: process.env["B2_REGION"],
  credentials: {
    accessKeyId: process.env["B2_KEY_ID"]!,
    secretAccessKey: process.env["B2_APPLICATION_KEY"]!,
  },
});

const BUCKET_NAME = process.env["B2_BUCKET_NAME"]!;

const MIME_TO_EXT: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/flac": "flac",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
};

async function getDbUserId(clerkUserId: string): Promise<number> {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId));
  if (!user) throw new Error("User not found");
  return user.id;
}

router.post("/presign", async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    }

    const { fileName, fileSize, mimeType, duration } = parsed.data;

    const ext = MIME_TO_EXT[mimeType] ?? fileName.split(".").pop() || "bin";
    const fileKey = `uploads/${auth.userId}/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: mimeType,
      ContentLength: fileSize,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 900, // 15 minutes
    });

    const dbUserId = await getDbUserId(auth.userId);

    const [song] = await db
      .insert(songs)
      .values({
        title: fileName,
        fileKey,
        status: "pending",
        duration,
        mimeType,
        userId: dbUserId,
      })
      .returning({ id: songs.id });

    return res.json({ uploadUrl: presignedUrl, songId: song.id, fileKey });
  } catch (error) {
    console.error("Presigned URL generation failed:", error);
    return res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

export default router;
