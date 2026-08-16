export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDate(value: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
    ...options,
  }).format(new Date(value));
}

export function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function formatRelativeTime(value: string) {
  const date = new Date(value);
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absoluteSeconds = Math.abs(seconds);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  for (const [unit, divisor] of units) {
    if (absoluteSeconds >= divisor) {
      return formatter.format(Math.round(seconds / divisor), unit);
    }
  }

  return "just now";
}

export function formatBytes(value: number) {
  if (value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    units.length - 1,
    Math.floor(Math.log(value) / Math.log(1024)),
  );
  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function formatCredits(value: number) {
  return `${formatNumber(value)} credits`;
}

export function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value / 100);
  } catch {
    return `${formatNumber(value)} ${currency}`;
  }
}

export function titleize(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function subscriptionTone(status: string | null | undefined) {
  if (status === "active") return "success" as const;
  if (status === "trialing") return "info" as const;
  if (status === "past_due" || status === "paused") return "warning" as const;
  if (status === "canceled" || status === "expired") return "danger" as const;
  return "neutral" as const;
}

export function healthTone(risk: string) {
  if (risk === "healthy") return "success" as const;
  if (risk === "watch") return "warning" as const;
  if (risk === "high" || risk === "critical") return "danger" as const;
  return "neutral" as const;
}
