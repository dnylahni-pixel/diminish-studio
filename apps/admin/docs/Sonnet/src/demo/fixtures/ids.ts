// =============================================================================
// Deterministic identifiers & clock for Demo Mode
// -----------------------------------------------------------------------------
// Demo Mode never calls crypto.randomUUID(): every id and every date is fixed
// so that `intelligence-lab` renders the same numbers on every run and so
// unit tests can assert exact expected output.
// =============================================================================

/** Produces a syntactically valid, version-4-looking UUID from a small integer seed. */
function fixedUuid(seed: number): string {
  const hex = seed.toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${hex}`;
}

/** Reference "now" for every demo scenario. Keeping it fixed makes fixtures reproducible. */
export const DEMO_NOW = new Date("2026-01-15T00:00:00.000Z");

export const PERIOD_M2_START = new Date("2025-11-01T00:00:00.000Z");
export const PERIOD_M2_END = new Date("2025-12-01T00:00:00.000Z");
export const PERIOD_M1_START = new Date("2025-12-01T00:00:00.000Z");
export const PERIOD_M1_END = new Date("2026-01-01T00:00:00.000Z");
export const PERIOD_M0_START = new Date("2026-01-01T00:00:00.000Z");
export const PERIOD_M0_END = new Date("2026-02-01T00:00:00.000Z");

export const IDS = {
  features: {
    seats: fixedUuid(1001),
    apiCalls: fixedUuid(1002),
    exportData: fixedUuid(1003),
    prioritySupport: fixedUuid(1004),
    advancedAnalytics: fixedUuid(1005),
    sso: fixedUuid(1006),
    dataWarehouseConnectorMissing: fixedUuid(1099), // intentionally never defined as a feature row
  },
  plans: {
    starter: fixedUuid(2001),
    pro: fixedUuid(2002),
    enterprise: fixedUuid(2003),
    legacy: fixedUuid(2004),
  },
  planVersions: {
    starterV1: fixedUuid(3001),
    proV1: fixedUuid(3002),
    proV2: fixedUuid(3003),
    enterpriseV1: fixedUuid(3004),
    legacyV1: fixedUuid(3005),
    legacyV2: fixedUuid(3006),
  },
  addons: {
    extraSeats: fixedUuid(4001),
    dedicatedSupport: fixedUuid(4002),
  },
  coupons: {
    welcome10: fixedUuid(5001),
    summer50Stale: fixedUuid(5002),
  },
  taxRates: {
    usCa: fixedUuid(6001),
    irVat: fixedUuid(6002),
  },
  users: {
    u1: fixedUuid(7001),
    u2: fixedUuid(7002),
    u3: fixedUuid(7003),
    u4: fixedUuid(7004),
    u5: fixedUuid(7005),
    u6: fixedUuid(7006),
    u7: fixedUuid(7007),
    u8: fixedUuid(7008),
    u9: fixedUuid(7009),
  },
  subscriptions: {
    s1: fixedUuid(8001),
    s2: fixedUuid(8002),
    s3: fixedUuid(8003),
    s4: fixedUuid(8004),
    s5: fixedUuid(8005),
    s6: fixedUuid(8006),
    s7a: fixedUuid(8007),
    s7b: fixedUuid(8008),
    s8: fixedUuid(8009),
    s9: fixedUuid(8010),
  },
  creditAccounts: {
    u1Usd: fixedUuid(9001),
    u3Irr: fixedUuid(9002),
    u4Usd: fixedUuid(9003),
    u9Usd: fixedUuid(9004),
  },
  creditPackages: {
    top1000: fixedUuid(10001),
  },
} as const;

export function daysFromNow(days: number): Date {
  return new Date(DEMO_NOW.getTime() + days * 24 * 60 * 60 * 1000);
}
