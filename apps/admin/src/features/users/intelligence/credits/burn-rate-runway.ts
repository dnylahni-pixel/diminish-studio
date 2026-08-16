import type { DailyCreditUsage } from "../shared/dataset-types";

const DAY_IN_MS = 86_400_000;

export interface CreditRunwayResult {
  averageDailyBurn: number;
  runwayDays: number | null;
  runwayLabel: string;
  riskLevel: "healthy" | "watch" | "critical" | "unknown";
  observedDays: number;
  totalCreditsConsumed: number;
}

export function calculateCreditBurnRateAndRunway(
  availableBalance: number,
  usage: DailyCreditUsage[],
  now: Date,
  windowDays = 30,
): CreditRunwayResult {
  const windowStart = new Date(now.getTime() - windowDays * DAY_IN_MS);
  const recentUsage = usage.filter(
    (row) => row.date >= windowStart && row.date <= now && row.credits > 0,
  );
  const observedDates = new Set(
    recentUsage.map((row) => row.date.toISOString().slice(0, 10)),
  );
  const totalCreditsConsumed = recentUsage.reduce(
    (total, row) => total + row.credits,
    0,
  );
  const observedDays = observedDates.size;
  const averageDailyBurn =
    observedDays > 0 ? totalCreditsConsumed / observedDays : 0;
  const runwayDays =
    averageDailyBurn > 0
      ? Math.max(0, Math.floor(availableBalance / averageDailyBurn))
      : null;

  if (runwayDays === null) {
    return {
      averageDailyBurn,
      runwayDays,
      runwayLabel: "Insufficient recent usage",
      riskLevel: "unknown",
      observedDays,
      totalCreditsConsumed,
    };
  }

  return {
    averageDailyBurn,
    runwayDays,
    runwayLabel:
      runwayDays === 0
        ? "Credit exhausted"
        : runwayDays === 1
          ? "About 1 day"
          : `About ${runwayDays} days`,
    riskLevel: runwayDays < 7 ? "critical" : runwayDays < 21 ? "watch" : "healthy",
    observedDays,
    totalCreditsConsumed,
  };
}
