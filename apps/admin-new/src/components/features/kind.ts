import type { ReactNode } from "react";
import { Database, Gauge, Package, ToggleRight } from "lucide-react";
import type { FeaturesKey } from "@/i18n/features";
import type { FeatureKind } from "./types";

export type IconType = (props: {
  className?: string;
  "aria-hidden"?: boolean;
}) => ReactNode;

// Shared metadata for the four feature kinds (labels + icons).
export const KIND_OPTIONS: Array<{
  value: FeatureKind;
  labelKey: FeaturesKey;
  icon: IconType;
}> = [
  { value: "boolean", labelKey: "kind.booleanLabel", icon: ToggleRight },
  { value: "metered", labelKey: "kind.meteredLabel", icon: Database },
  { value: "quota", labelKey: "kind.quotaLabel", icon: Gauge },
  { value: "package", labelKey: "kind.packageLabel", icon: Package },
];

export function kindIcon(kind: FeatureKind): IconType {
  return KIND_OPTIONS.find((option) => option.value === kind)?.icon ?? ToggleRight;
}
