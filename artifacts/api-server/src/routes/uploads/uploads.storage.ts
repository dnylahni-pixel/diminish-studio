import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "../../lib/logger";
import { PRESIGN_EXPIRY_SECONDS, MAGIC_BYTES_MAP } from "./uploads.constants";

// ─── Validation at startup ─────────────────────────────────

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. Server cannot start.`,
    );
  }
  return value;
}

function validateEnv() {
  requireEnv("B2_ENDPOINT");
  requireEnv("B2_REGION");
  requireEnv("B2_KEY_ID");
  requireEnv("B2_APPLICATION_KEY");
  requireEnv("BUCKET_NAME");
  logger.info("All required S3 env vars are present");
}

validateEnv();

// ─── S3 Client ────────────────────────────────────────────

function createS3Client(): S3Client {
  return new S3Client({
    endpoint: process.env["B2_ENDPOINT"],
    region: process.env["B2_REGION"],
    credentials: {
      accessKeyId: process.env["B2_KEY_ID"]!,
      secretAccessKey: process.env["B2_APPLICATION_KEY"]!,
    },
    forcePathStyle: true,
  });
}

export const s3Client = createS3Client();

export const BUCKET_NAME = process.env["BUCKET_NAME"]!;
export const QUARANTINE_PREFIX = "quarantine";

// ─── Presigned URL ─────────────────────────────────────────

export async function createPresignedUploadUrl(
  quarantineKey: string,
  mimeType: string,
  fileSize: number,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: quarantineKey,
    ContentType: mimeType,
    ContentLength: fileSize,
  });

  return getSignedUrl(s3Client, command, {
    expiresIn: PRESIGN_EXPIRY_SECONDS,
  });
}

// ─── Head / Copy / Delete ──────────────────────────────────

export async function headQuarantineObject(key: string) {
  return s3Client.send(
    new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }),
  );
}

export async function copyObject(
  sourceKey: string,
  destKey: string,
  contentType: string,
) {
  return s3Client.send(
    new CopyObjectCommand({
      Bucket: BUCKET_NAME,
      Key: destKey,
      CopySource: encodeURIComponent(`${BUCKET_NAME}/${sourceKey}`),
      ContentType: contentType,
    }),
  );
}

export async function deleteObject(key: string) {
  return s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }),
  );
}

// ─── Magic Bytes Verification ──────────────────────────────

export async function verifyMagicBytes(
  key: string,
  ext: string,
): Promise<boolean> {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Range: "bytes=0-15",
      }),
    );

    if (!response.Body) return false;

    const streamToBuffer = async (stream: unknown): Promise<Buffer> => {
      return new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        (stream as NodeJS.ReadableStream).on("data", (chunk: Uint8Array) =>
          chunks.push(chunk),
        );
        (stream as NodeJS.ReadableStream).on("error", reject);
        (stream as NodeJS.ReadableStream).on("end", () =>
          resolve(Buffer.concat(chunks)),
        );
      });
    };

    const buffer = await streamToBuffer(response.Body);
    const expectedMagic = MAGIC_BYTES_MAP[ext];
    if (!expectedMagic) return true; // extension not in magic map — skip check

    return expectedMagic.every(
      (byte, index) =>
        buffer[index] === byte ||
        // Loose match: raw MP3 frames start with 0xFF 0xFB (checked below)
        (ext === "mp3" && index > 1),
    );
  } catch (err) {
    logger.error({ err }, "Magic bytes verification failed");
    return false;
  }
}