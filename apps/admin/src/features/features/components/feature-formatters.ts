import type { FeatureKind } from "../types";

export function formatNumber(value: number | string) {
  const parsed = Number(value);
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(parsed) ? parsed : 0);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function titleize(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getFeatureKindTone(
  kind: FeatureKind,
): "neutral" | "primary" | "warning" | "info" {
  if (kind === "metered") return "primary";
  if (kind === "quota") return "warning";
  if (kind === "package") return "info";
  return "neutral";
}
