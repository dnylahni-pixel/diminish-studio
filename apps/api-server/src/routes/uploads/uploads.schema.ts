import { z } from "zod";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, MAX_DURATION_SECONDS } from "./uploads.constants";

export const presignBodySchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
  duration: z.number().positive().max(MAX_DURATION_SECONDS),
});

export const confirmBodySchema = z.object({
  uploadToken: z.string().uuid(),
  expectedSize: z.number().int().positive().max(MAX_FILE_SIZE),
  expectedMime: z.enum(ALLOWED_MIME_TYPES),
  title: z.string().min(1).max(255).optional(),
  duration: z.number().positive().max(MAX_DURATION_SECONDS),
});

export type PresignBody = z.infer<typeof presignBodySchema>;
export type ConfirmBody = z.infer<typeof confirmBodySchema>;