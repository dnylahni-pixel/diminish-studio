/**
 * Pure, side-effect-free formatting helpers for Runpod display data. No
 * network access, no environment access — safe to import from client
 * components.
 */

import type { MessageKey, TFunction } from "@/i18n/translate";

export function formatCredits(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "—";
  }
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

export function formatCreditsPerHour(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "—";
  }
  return `${formatCredits(amount)}/hr`;
}

export function formatGb(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return `${value.toLocaleString("en-US")} GB`;
}

export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return value.toLocaleString("en-US");
}

export function formatMaskedEmail(email: string | null | undefined): string {
  if (!email) return "—";
  const [local, domain] = email.split("@");
  if (!domain) return "•••";
  const visible = local.slice(0, 1);
  return `${visible}${"•".repeat(Math.max(local.length - 1, 3))}@${domain}`;
}

export function formatTimestamp(
  iso: string | null | undefined,
  t?: TFunction,
): { relative: string; absolute: string } {
  if (!iso) {
    return { relative: "—", absolute: "—" };
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return { relative: "—", absolute: iso };
  }
  const absolute = date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });

  const diffMs = date.getTime() - Date.now();
  const diffSeconds = Math.round(diffMs / 1000);
  const absDiff = Math.abs(diffSeconds);

  let relativeKey: MessageKey;
  let relativeEnglish: string;
  let vars: Record<string, string | number> | undefined;

  if (absDiff < 60) {
    if (diffSeconds >= 0) {
      relativeKey = "runpod.time.inAFewSeconds";
      relativeEnglish = "in a few seconds";
    } else {
      relativeKey = "runpod.time.justNow";
      relativeEnglish = "just now";
    }
  } else if (absDiff < 3600) {
    relativeKey = "runpod.time.minutesAgo";
    relativeEnglish = `${Math.floor(absDiff / 60)}m ago`;
    vars = { minutes: Math.floor(absDiff / 60) };
  } else if (absDiff < 86400) {
    relativeKey = "runpod.time.hoursAgo";
    relativeEnglish = `${Math.floor(absDiff / 3600)}h ago`;
    vars = { hours: Math.floor(absDiff / 3600) };
  } else if (absDiff < 2592000) {
    relativeKey = "runpod.time.daysAgo";
    relativeEnglish = `${Math.floor(absDiff / 86400)}d ago`;
    vars = { days: Math.floor(absDiff / 86400) };
  } else {
    relativeKey = "runpod.time.monthsAgo";
    relativeEnglish = `${Math.floor(absDiff / 2592000)}mo ago`;
    vars = { months: Math.floor(absDiff / 2592000) };
  }

  return { relative: t ? t(relativeKey, vars) : relativeEnglish, absolute };
}

export function formatUptime(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "—";
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
  return parts.join(" ");
}

export function podStatusTone(status: string | null | undefined): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "RUNNING":
      return "success";
    case "EXITED":
      return "warning";
    case "TERMINATED":
      return "danger";
    default:
      return "neutral";
  }
}

export function podStatusLabel(status: string | null | undefined): MessageKey {
  switch (status) {
    case "RUNNING":
      return "runpod.pods.status.running";
    case "EXITED":
      return "runpod.pods.status.exited";
    case "TERMINATED":
      return "runpod.pods.status.terminated";
    default:
      return "runpod.pods.status.unknown";
  }
}
