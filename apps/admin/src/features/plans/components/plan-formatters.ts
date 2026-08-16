import type {
  BillingInterval,
  PlanPriceSummary,
  PlanStatus,
  PlanVersionStatus,
  SubscriptionStatus,
} from "../types";
import type { MessageKey, TFunction } from "@/i18n/translate";

export type SemanticTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";

function currencyDigits(currency: string) {
  try {
    return (
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
      }).resolvedOptions().maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

export function formatMoney(amount: string, currency: string) {
  try {
    const digits = currencyDigits(currency);
    const divisor = BigInt(10) ** BigInt(digits);
    const parsed = BigInt(amount);
    const absolute = parsed < BigInt(0) ? -parsed : parsed;
    const whole = absolute / divisor;
    const fraction = absolute % divisor;
    const symbol =
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        currencyDisplay: "narrowSymbol",
      })
        .formatToParts(0)
        .find((part) => part.type === "currency")?.value ?? currency;
    const formattedWhole = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(whole);
    const formattedFraction =
      digits > 0 ? `.${fraction.toString().padStart(digits, "0")}` : "";
    const prefix = parsed < BigInt(0) ? "-" : "";
    const separator = symbol.length > 2 ? " " : "";

    return `${prefix}${symbol}${separator}${formattedWhole}${formattedFraction}`;
  } catch {
    return `${currency} ${amount}`;
  }
}

export function formatNumber(value: number | string) {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed)) return String(value);

  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(parsed);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDateTime(value: string | null, t: TFunction) {
  if (!value) return t("plans.formatters.notScheduled");

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(value));
}

export function formatDate(value: string | null, t: TFunction) {
  if (!value) return t("plans.formatters.openEnded");

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function formatDateRange(from: string | null, to: string | null, t: TFunction) {
  if (!from && !to) return t("plans.formatters.noEffectiveWindow");
  if (!from) return t("plans.formatters.untilDate", { date: formatDate(to, t) });
  if (!to) return t("plans.formatters.fromDate", { date: formatDate(from, t) });
  return `${formatDate(from, t)} – ${formatDate(to, t)}`;
}

export function titleize(value: string) {
  return value
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function formatInterval(
  interval: BillingInterval | null,
  intervalCount: number | null,
  t: TFunction,
) {
  if (!interval) return t("plans.formatters.oneTime");

  const count = intervalCount ?? 1;
  const intervalName = t(`plans.formatters.intervals.${interval}` as MessageKey);
  return count === 1
    ? t("plans.formatters.perInterval", { interval: intervalName })
    : t("plans.formatters.everyInterval", { count, interval: intervalName });
}

export function formatPrice(price: PlanPriceSummary, t: TFunction) {
  const amount = formatMoney(price.amount, price.currency);
  return price.priceType === "one_time"
    ? `${amount} ${t("plans.formatters.oneTime")}`
    : `${amount} ${formatInterval(price.billingInterval, price.billingIntervalCount, t)}`;
}

const ENUM_KEY_MAP: Record<string, string> = {
  draft: "plans.enums.draft",
  active: "plans.enums.active",
  archived: "plans.enums.archived",
  published: "plans.enums.published",
  retired: "plans.enums.retired",
  recurring: "plans.enums.recurring",
  one_time: "plans.enums.oneTime",
  trialing: "plans.enums.trialing",
  past_due: "plans.enums.pastDue",
  paused: "plans.enums.paused",
  incomplete: "plans.enums.incomplete",
  canceled: "plans.enums.canceled",
  expired: "plans.enums.expired",
  subscription: "plans.enums.subscription",
  account: "plans.enums.account",
  public: "plans.enums.public",
  private: "plans.enums.private",
  none: "plans.enums.none",
  immediate: "plans.enums.immediate",
  next_cycle: "plans.enums.nextCycle",
  unit: "plans.enums.unit",
  minute: "plans.enums.minute",
  megabyte: "plans.enums.megabyte",
  request: "plans.enums.request",
  seat: "plans.enums.seat",
  flat: "plans.enums.flat",
  tiered: "plans.enums.tiered",
  volume: "plans.enums.volume",
  boolean: "plans.enums.boolean",
  metered: "plans.enums.metered",
  quota: "plans.enums.quota",
  package: "plans.enums.package",
  block: "plans.enums.block",
  allow_overage: "plans.enums.allowOverage",
  day: "plans.enums.day",
  week: "plans.enums.week",
  month: "plans.enums.month",
  year: "plans.enums.year",
  daily: "plans.enums.daily",
  weekly: "plans.enums.weekly",
  monthly: "plans.enums.monthly",
};

/** Translate a known plan enum slug; fall back to Title Case for unknown values. */
export function enumLabel(t: TFunction, value: string) {
  const key = ENUM_KEY_MAP[value];
  if (key) return t(key as MessageKey);
  return titleize(value);
}

export function getPlanStatusTone(status: PlanStatus): SemanticTone {
  if (status === "active") return "success";
  if (status === "draft") return "info";
  return "neutral";
}

export function getVersionStatusTone(status: PlanVersionStatus): SemanticTone {
  if (status === "published") return "success";
  if (status === "draft") return "info";
  return "neutral";
}

export function getSubscriptionStatusTone(status: SubscriptionStatus): SemanticTone {
  if (status === "active") return "success";
  if (status === "trialing") return "info";
  if (status === "past_due" || status === "paused") return "warning";
  if (status === "incomplete") return "danger";
  return "neutral";
}
