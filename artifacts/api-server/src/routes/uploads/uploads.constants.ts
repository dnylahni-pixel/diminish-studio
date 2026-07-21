import { UploadErrorCode } from "./uploads.types";

// ─── Constants ────────────────────────────────────────────

export const ALLOWED_MIME_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/flac",
  "audio/mp4",
  "audio/ogg",
] as const;

export const MAX_FILE_SIZE = 104_857_600; // 100 MB
export const MAX_DURATION_SECONDS = 600; // 10 minutes
export const PRESIGN_EXPIRY_SECONDS = 900; // 15 minutes

export const MIME_TO_EXT: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/flac": "flac",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
};

// Magic Bytes map for server-side audio file validation
export const MAGIC_BYTES_MAP: Record<string, number[]> = {
  mp3: [0x49, 0x44, 0x33], // ID3 v2 (also matches 0xFF 0xFB for raw frames — checked lazily)
  wav: [0x52, 0x49, 0x46, 0x46], // RIFF
  flac: [0x66, 0x4c, 0x61, 0x43], // fLaC
  m4a: [0x66, 0x74, 0x79, 0x70], // ftyp (MP4/M4A)
  ogg: [0x4f, 0x67, 0x67, 0x53], // OggS
};