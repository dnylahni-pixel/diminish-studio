import type { FeatureOption } from "./types";

// =============================================================================
// MOCK data — placeholder for the real `getFeatureCreationData()` query.
// The shape mirrors the backend FeatureOption; values are samples (the user put
// similar rows in the DB). Swap this import for the real query when the new
// admin is wired to the backend.
// =============================================================================
export const AVAILABLE_FEATURES: FeatureOption[] = [
  { id: "feat-chord-detection", code: "chord_detection", name: "تشخیص آکورد", kind: "metered", unitName: "تشخیص", isActive: true },
  { id: "feat-stem-separation", code: "stem_separation", name: "جدا کردن صدا", kind: "metered", unitName: "آهنگ", isActive: true },
  { id: "feat-smart-chords", code: "smart_chords", name: "آکورد هوشمند", kind: "metered", unitName: "تشخیص", isActive: true },
  { id: "feat-lyrics", code: "lyrics", name: "متن آهنگ", kind: "boolean", unitName: null, isActive: true },
  { id: "feat-library-storage", code: "library_storage", name: "حافظهٔ کتابخانه", kind: "quota", unitName: "گیگابایت", isActive: true },
  { id: "feat-background-playback", code: "background_playback", name: "پخش پس‌زمینه", kind: "boolean", unitName: null, isActive: true },
  { id: "feat-upload-transcription", code: "upload_transcription", name: "رونوشت آپلود", kind: "metered", unitName: "دقیقه", isActive: true },
  { id: "feat-starter-kit", code: "starter_kit", name: "بستهٔ آغازین", kind: "package", unitName: null, isActive: true },
];
