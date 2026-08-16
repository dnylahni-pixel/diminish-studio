import type { FeatureKind, FeatureOption } from "@/features/features/types";

// Re-exported from the real backend contract (same source as the old admin).
export type { FeatureKind, FeatureOption };
export type DefaultAccess = "allow" | "deny";
