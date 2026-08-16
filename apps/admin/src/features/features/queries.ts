import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
} from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import {
  featureDependencies,
  featurePricingRules,
  features,
  planFeatures,
  planLimits,
  plans,
  planVersions,
  usageDailyAggregates,
  usageEvents,
} from "@/db/schema";
import { detectFeatureDependencyCycles } from "@/features/catalog-intelligence";
import type {
  FeatureCreationData,
  FeatureDetailData,
  FeatureKind,
  FeatureListItem,
  FeaturePolicyFilter,
  FeaturesFilters,
  FeaturesListData,
  FeaturesSearchParams,
  FeatureSort,
  FeatureStatusFilter,
  SortDirection,
} from "./types";

const PAGE_SIZE = 20;
const FEATURE_KINDS: FeatureKind[] = ["boolean", "metered", "quota", "package"];
const STATUS_FILTERS: FeatureStatusFilter[] = ["all", "active", "inactive"];
const POLICY_FILTERS: FeaturePolicyFilter[] = [
  "all",
  "open",
  "restricted",
  "metered",
  "unconfigured",
];
const SORT_OPTIONS: FeatureSort[] = ["name", "updated", "usage"];
const DIRECTIONS: SortDirection[] = ["asc", "desc"];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isOneOf<T extends string>(
  value: string | undefined,
  options: readonly T[],
): value is T {
  return value !== undefined && options.includes(value as T);
}

function toCount(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toStringValue(value: number | string | bigint | null | undefined) {
  return value === null || value === undefined ? "0" : String(value);
}

function formatRelativeTimestamp(
  value: Date,
  now: Date,
  locale: Locale,
  justNowLabel: string,
) {
  const seconds = Math.round((value.getTime() - now.getTime()) / 1000);
  const absoluteSeconds = Math.abs(seconds);
  if (absoluteSeconds < 60) return justNowLabel;

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  for (const [unit, divisor] of units) {
    if (absoluteSeconds >= divisor) {
      return formatter.format(Math.round(seconds / divisor), unit);
    }
  }

  return justNowLabel;
}

export function parseFeaturesFilters(
  rawParams: FeaturesSearchParams,
): FeaturesFilters {
  const q = (firstParam(rawParams.q) ?? "").trim().slice(0, 120);
  const requestedStatus = firstParam(rawParams.status);
  const requestedKind = firstParam(rawParams.kind);
  const requestedPolicy = firstParam(rawParams.policy);
  const requestedSort = firstParam(rawParams.sort);
  const requestedDirection = firstParam(rawParams.direction);
  const requestedPage = Number.parseInt(firstParam(rawParams.page) ?? "1", 10);

  return {
    q,
    status: isOneOf(requestedStatus, STATUS_FILTERS) ? requestedStatus : "all",
    kind: isOneOf(requestedKind, FEATURE_KINDS) ? requestedKind : "all",
    policy: isOneOf(requestedPolicy, POLICY_FILTERS) ? requestedPolicy : "all",
    sort: isOneOf(requestedSort, SORT_OPTIONS) ? requestedSort : "updated",
    direction: isOneOf(requestedDirection, DIRECTIONS)
      ? requestedDirection
      : requestedSort === "name"
        ? "asc"
        : "desc",
    page: Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    pageSize: PAGE_SIZE,
  };
}

export async function getFeaturesListData(
  rawParams: FeaturesSearchParams,
  lang: Locale,
): Promise<FeaturesListData> {
  const filters = parseFeaturesFilters(rawParams);
  const i18n = await getI18n(isLocale(lang) ? lang : defaultLocale);
  const conditions: Array<SQL | undefined> = [];

  if (filters.q) {
    const search = `%${filters.q}%`;
    conditions.push(
      or(
        ilike(features.name, search),
        ilike(features.code, search),
        ilike(features.description, search),
      ),
    );
  }

  if (filters.status !== "all") {
    conditions.push(eq(features.isActive, filters.status === "active"));
  }

  if (filters.kind !== "all") {
    conditions.push(eq(features.kind, filters.kind));
  }

  if (filters.policy === "metered") {
    conditions.push(eq(features.kind, "metered"));
  } else if (filters.policy === "open") {
    conditions.push(
      sql`NOT EXISTS (
        SELECT 1 FROM ${planLimits}
        WHERE ${planLimits.featureId} = ${features.id}
      ) AND NOT EXISTS (
        SELECT 1 FROM ${featurePricingRules}
        WHERE ${featurePricingRules.featureId} = ${features.id}
          AND ${featurePricingRules.isActive} = true
      )`,
    );
  } else if (filters.policy === "restricted") {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM ${planLimits}
        WHERE ${planLimits.featureId} = ${features.id}
      )`,
    );
  } else if (filters.policy === "unconfigured") {
    conditions.push(
      sql`NOT EXISTS (
        SELECT 1 FROM ${planFeatures}
        WHERE ${planFeatures.featureId} = ${features.id}
      )`,
    );
  }

  const whereClause = and(...conditions);
  const [
    summaryRows,
    usageSummaryRows,
    filteredCountRows,
  ] = await Promise.all([
    db
      .select({
        totalFeatures: sql<string>`COUNT(*)::text`,
        activeFeatures: sql<string>`COUNT(*) FILTER (WHERE ${features.isActive} = true)::text`,
        meteredFeatures: sql<string>`COUNT(*) FILTER (WHERE ${features.kind} = 'metered')::text`,
        configuredPolicies: sql<string>`COUNT(*) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM ${planFeatures}
            WHERE ${planFeatures.featureId} = ${features.id}
          )
        )::text`,
      })
      .from(features),
    db
      .select({
        quantity: sql<string>`COALESCE(SUM(${usageDailyAggregates.totalQuantity}), 0)::text`,
        credits: sql<string>`COALESCE(SUM(${usageDailyAggregates.totalCredits}), 0)::text`,
      })
      .from(usageDailyAggregates)
      .where(sql`${usageDailyAggregates.dateBucket} >= NOW() - INTERVAL '30 days'`),
    db.select({ value: count() }).from(features).where(whereClause),
  ]);

  const totalItems = toCount(filteredCountRows[0]?.value);
  const pageCount = Math.max(1, Math.ceil(totalItems / filters.pageSize));
  const currentPage = Math.min(filters.page, pageCount);
  const offset = (currentPage - 1) * filters.pageSize;

  const usageSort = sql<number>`COALESCE((
    SELECT SUM(${usageDailyAggregates.totalQuantity})
    FROM ${usageDailyAggregates}
    WHERE ${usageDailyAggregates.featureId} = ${features.id}
      AND ${usageDailyAggregates.dateBucket} >= NOW() - INTERVAL '30 days'
  ), 0)`;
  const sortColumn =
    filters.sort === "name"
      ? features.name
      : filters.sort === "usage"
        ? usageSort
        : features.updatedAt;
  const sortExpression =
    filters.direction === "asc" ? asc(sortColumn) : desc(sortColumn);

  const featureRows = await db
    .select({
      id: features.id,
      code: features.code,
      name: features.name,
      description: features.description,
      kind: features.kind,
      unitName: features.unitName,
      isActive: features.isActive,
      updatedAt: features.updatedAt,
    })
    .from(features)
    .where(whereClause)
    .orderBy(sortExpression, asc(features.id))
    .limit(filters.pageSize)
    .offset(offset);

  const featureIds = featureRows.map((row) => row.id);
  const [
    planCountRows,
    dependencyCountRows,
    limitCountRows,
    pricingCountRows,
    usageRows,
  ] =
    featureIds.length > 0
      ? await Promise.all([
          db
            .select({
              featureId: planFeatures.featureId,
              value: sql<string>`COUNT(DISTINCT ${planVersions.planId})::text`,
            })
            .from(planFeatures)
            .innerJoin(
              planVersions,
              eq(planVersions.id, planFeatures.planVersionId),
            )
            .where(inArray(planFeatures.featureId, featureIds))
            .groupBy(planFeatures.featureId),
          db
            .select({
              featureId: featureDependencies.featureId,
              value: sql<string>`COUNT(*)::text`,
            })
            .from(featureDependencies)
            .where(inArray(featureDependencies.featureId, featureIds))
            .groupBy(featureDependencies.featureId),
          db
            .select({
              featureId: planLimits.featureId,
              value: sql<string>`COUNT(*)::text`,
            })
            .from(planLimits)
            .where(inArray(planLimits.featureId, featureIds))
            .groupBy(planLimits.featureId),
          db
            .select({
              featureId: featurePricingRules.featureId,
              value: sql<string>`COUNT(*) FILTER (WHERE ${featurePricingRules.isActive} = true)::text`,
            })
            .from(featurePricingRules)
            .where(inArray(featurePricingRules.featureId, featureIds))
            .groupBy(featurePricingRules.featureId),
          db
            .select({
              featureId: usageDailyAggregates.featureId,
              quantity: sql<string>`COALESCE(SUM(${usageDailyAggregates.totalQuantity}), 0)::text`,
              credits: sql<string>`COALESCE(SUM(${usageDailyAggregates.totalCredits}), 0)::text`,
            })
            .from(usageDailyAggregates)
            .where(
              and(
                inArray(usageDailyAggregates.featureId, featureIds),
                sql`${usageDailyAggregates.dateBucket} >= NOW() - INTERVAL '30 days'`,
              ),
            )
            .groupBy(usageDailyAggregates.featureId),
        ])
      : [[], [], [], [], []];

  const countMap = (
    rows: Array<{ featureId: string; value: string }>,
  ) => new Map(rows.map((row) => [row.featureId, toCount(row.value)]));
  const planCounts = countMap(planCountRows);
  const dependencyCounts = countMap(dependencyCountRows);
  const limitCounts = countMap(limitCountRows);
  const pricingCounts = countMap(pricingCountRows);
  const usageByFeature = new Map(
    usageRows.map((row) => [
      row.featureId,
      { quantity: row.quantity, credits: row.credits },
    ]),
  );
  const now = new Date();
  const items: FeatureListItem[] = featureRows.map((feature) => ({
    id: feature.id,
    code: feature.code,
    name: feature.name,
    description: feature.description,
    kind: feature.kind,
    unitName: feature.unitName,
    isActive: feature.isActive,
    updatedAt: feature.updatedAt.toISOString(),
    updatedRelative: formatRelativeTimestamp(
      feature.updatedAt,
      now,
      isLocale(lang) ? lang : defaultLocale,
      i18n.t("features.table.justNow"),
    ),
    planCount: planCounts.get(feature.id) ?? 0,
    dependencyCount: dependencyCounts.get(feature.id) ?? 0,
    limitPolicyCount: limitCounts.get(feature.id) ?? 0,
    pricingRuleCount: pricingCounts.get(feature.id) ?? 0,
    usageQuantity30d: usageByFeature.get(feature.id)?.quantity ?? "0",
    usageCredits30d: usageByFeature.get(feature.id)?.credits ?? "0",
  }));
  const summary = summaryRows[0];
  const usageSummary = usageSummaryRows[0];

  return {
    filters: { ...filters, page: currentPage },
    summary: {
      totalFeatures: toCount(summary?.totalFeatures),
      activeFeatures: toCount(summary?.activeFeatures),
      meteredFeatures: toCount(summary?.meteredFeatures),
      configuredPolicies: toCount(summary?.configuredPolicies),
      usageQuantity30d: usageSummary?.quantity ?? "0",
      usageCredits30d: usageSummary?.credits ?? "0",
    },
    items,
    totalItems,
    pageCount,
  };
}

export async function getFeatureCreationData(): Promise<FeatureCreationData> {
  const rows = await db
    .select({
      id: features.id,
      code: features.code,
      name: features.name,
      kind: features.kind,
      unitName: features.unitName,
      isActive: features.isActive,
    })
    .from(features)
    .where(eq(features.isActive, true))
    .orderBy(asc(features.name), asc(features.code));

  return { features: rows };
}

export async function getFeatureDetail(
  featureId: string,
): Promise<FeatureDetailData | null> {
  const featureRows = await db
    .select()
    .from(features)
    .where(eq(features.id, featureId))
    .limit(1);
  const feature = featureRows[0];
  if (!feature) return null;

  const [
    allFeatures,
    dependencyRows,
    planFeatureRows,
    limitRows,
    pricingRows,
    allPlanVersions,
    usageSummaryRows,
    usageDailyRows,
    allDependencies,
  ] = await Promise.all([
    db
      .select({
        id: features.id,
        code: features.code,
        name: features.name,
        kind: features.kind,
        unitName: features.unitName,
        isActive: features.isActive,
      })
      .from(features)
      .orderBy(asc(features.name), asc(features.code)),
    db
      .select()
      .from(featureDependencies)
      .where(
        or(
          eq(featureDependencies.featureId, featureId),
          eq(featureDependencies.dependsOnFeatureId, featureId),
        ),
      ),
    db
      .select({
        id: planFeatures.id,
        planVersionId: planFeatures.planVersionId,
        isIncluded: planFeatures.isIncluded,
        config: planFeatures.config,
        planId: plans.id,
        planCode: plans.code,
        planName: plans.name,
        planStatus: plans.status,
        versionNumber: planVersions.versionNumber,
        versionStatus: planVersions.status,
      })
      .from(planFeatures)
      .innerJoin(
        planVersions,
        eq(planVersions.id, planFeatures.planVersionId),
      )
      .innerJoin(plans, eq(plans.id, planVersions.planId))
      .where(eq(planFeatures.featureId, featureId))
      .orderBy(asc(plans.name), desc(planVersions.versionNumber)),
    db
      .select()
      .from(planLimits)
      .where(eq(planLimits.featureId, featureId))
      .orderBy(asc(planLimits.period)),
    db
      .select()
      .from(featurePricingRules)
      .where(eq(featurePricingRules.featureId, featureId))
      .orderBy(desc(featurePricingRules.isActive), asc(featurePricingRules.metric)),
    db
      .select({
        id: planVersions.id,
        planId: plans.id,
        planCode: plans.code,
        planName: plans.name,
        planStatus: plans.status,
        versionNumber: planVersions.versionNumber,
        versionStatus: planVersions.status,
      })
      .from(planVersions)
      .innerJoin(plans, eq(plans.id, planVersions.planId))
      .orderBy(asc(plans.name), desc(planVersions.versionNumber)),
    db
      .select({
        quantity: sql<string>`COALESCE(SUM(${usageEvents.quantity}), 0)::text`,
        credits: sql<string>`COALESCE(SUM(${usageEvents.creditCost}), 0)::text`,
        money: sql<string>`COALESCE(SUM(${usageEvents.moneyCost}), 0)::text`,
        activeUsers: sql<string>`COUNT(DISTINCT ${usageEvents.userId})::text`,
        events: sql<string>`COUNT(*)::text`,
      })
      .from(usageEvents)
      .where(
        and(
          eq(usageEvents.featureId, featureId),
          sql`${usageEvents.createdAt} >= NOW() - INTERVAL '30 days'`,
          sql`${usageEvents.status} <> 'reversed'`,
        ),
      ),
    db
      .select({
        date: sql<string>`TO_CHAR(${usageDailyAggregates.dateBucket}, 'YYYY-MM-DD')`,
        quantity: sql<string>`COALESCE(SUM(${usageDailyAggregates.totalQuantity}), 0)::text`,
        credits: sql<string>`COALESCE(SUM(${usageDailyAggregates.totalCredits}), 0)::text`,
        money: sql<string>`COALESCE(SUM(${usageDailyAggregates.totalMoney}), 0)::text`,
      })
      .from(usageDailyAggregates)
      .where(
        and(
          eq(usageDailyAggregates.featureId, featureId),
          sql`${usageDailyAggregates.dateBucket} >= NOW() - INTERVAL '30 days'`,
        ),
      )
      .groupBy(sql`TO_CHAR(${usageDailyAggregates.dateBucket}, 'YYYY-MM-DD')`)
      .orderBy(sql`TO_CHAR(${usageDailyAggregates.dateBucket}, 'YYYY-MM-DD')`),
    db.select().from(featureDependencies),
  ]);

  const featureById = new Map(allFeatures.map((row) => [row.id, row]));
  const dependencyDetails = dependencyRows
    .map((row) => {
      const source = featureById.get(row.featureId);
      const target = featureById.get(row.dependsOnFeatureId);
      if (!source || !target) return null;
      return {
        id: row.id,
        featureId: row.featureId,
        featureCode: source.code,
        featureName: source.name,
        dependsOnFeatureId: row.dependsOnFeatureId,
        dependsOnFeatureCode: target.code,
        dependsOnFeatureName: target.name,
        isHardDependency: row.isHardDependency,
        conditionConfig: row.conditionConfig,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const limitsByVersion = new Map<string, FeatureDetailData["planPolicies"][number]["limits"]>();
  for (const row of limitRows) {
    const current = limitsByVersion.get(row.planVersionId) ?? [];
    current.push({
      id: row.id,
      limitValue: row.limitValue === null ? null : String(row.limitValue),
      period: row.period,
      behavior: row.behavior,
      overageUnitPrice:
        row.overageUnitPrice === null ? null : String(row.overageUnitPrice),
      metadata: row.metadata,
    });
    limitsByVersion.set(row.planVersionId, current);
  }

  const pricingByVersion = new Map<string, FeatureDetailData["planPolicies"][number]["pricingRules"]>();
  for (const row of pricingRows) {
    const current = pricingByVersion.get(row.planVersionId) ?? [];
    current.push({
      id: row.id,
      metric: row.metric,
      pricingModel: row.pricingModel,
      currency: row.currency,
      unitPrice: row.unitPrice === null ? null : String(row.unitPrice),
      creditCostPerUnit:
        row.creditCostPerUnit === null ? null : String(row.creditCostPerUnit),
      minimumCharge:
        row.minimumCharge === null ? null : String(row.minimumCharge),
      tiers: row.tiers,
      isActive: row.isActive,
      metadata: row.metadata,
    });
    pricingByVersion.set(row.planVersionId, current);
  }

  const configuredVersionIds = new Set([
    ...planFeatureRows.map((row) => row.planVersionId),
    ...limitRows.map((row) => row.planVersionId),
    ...pricingRows.map((row) => row.planVersionId),
  ]);
  const planFeatureByVersion = new Map(
    planFeatureRows.map((row) => [row.planVersionId, row]),
  );
  const planVersionById = new Map(allPlanVersions.map((row) => [row.id, row]));
  const planPolicies = [...configuredVersionIds]
    .map((planVersionId) => {
      const version = planVersionById.get(planVersionId);
      if (!version) return null;
      const planFeature = planFeatureByVersion.get(planVersionId);
      return {
        planId: version.planId,
        planCode: version.planCode,
        planName: version.planName,
        planStatus: version.planStatus,
        planVersionId,
        versionNumber: version.versionNumber,
        versionStatus: version.versionStatus,
        isIncluded: planFeature?.isIncluded ?? null,
        config: planFeature?.config ?? {},
        limits: limitsByVersion.get(planVersionId) ?? [],
        pricingRules: pricingByVersion.get(planVersionId) ?? [],
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort(
      (left, right) =>
        left.planName.localeCompare(right.planName) ||
        right.versionNumber - left.versionNumber,
    );

  const graphReport = detectFeatureDependencyCycles(
    allFeatures.map((row) => ({
      id: row.id,
      key: row.code,
      name: row.name,
      category: null,
      isMetered: row.kind === "metered",
      unit: row.unitName,
      status: row.isActive ? ("active" as const) : ("archived" as const),
    })),
    allDependencies.map((row) => ({
      id: row.id,
      featureId: row.featureId,
      dependsOnFeatureId: row.dependsOnFeatureId,
      dependencyType: row.isHardDependency
        ? ("requires" as const)
        : ("recommends" as const),
    })),
  );
  const cycles = graphReport.cycles.filter((cycle) => cycle.cycle.includes(featureId));
  const usageSummary = usageSummaryRows[0];

  return {
    feature: {
      id: feature.id,
      code: feature.code,
      name: feature.name,
      description: feature.description,
      kind: feature.kind,
      unitName: feature.unitName,
      isActive: feature.isActive,
      metadata: feature.metadata,
      createdAt: feature.createdAt.toISOString(),
      updatedAt: feature.updatedAt.toISOString(),
    },
    dependencies: dependencyDetails.filter((row) => row.featureId === featureId),
    requiredBy: dependencyDetails.filter(
      (row) => row.dependsOnFeatureId === featureId,
    ),
    planPolicies,
    availableFeatures: allFeatures.filter((row) => row.id !== featureId),
    availablePlanVersions: allPlanVersions.map((row) => ({
      id: row.id,
      label: `${row.planName} · v${row.versionNumber} · ${row.versionStatus}`,
      planId: row.planId,
      planStatus: row.planStatus,
      versionNumber: row.versionNumber,
      versionStatus: row.versionStatus,
    })),
    usage: {
      quantity30d: toStringValue(usageSummary?.quantity),
      credits30d: toStringValue(usageSummary?.credits),
      money30d: toStringValue(usageSummary?.money),
      activeUsers30d: toCount(usageSummary?.activeUsers),
      events30d: toCount(usageSummary?.events),
      daily: usageDailyRows.map((row) => ({
        date: row.date,
        quantity: row.quantity,
        credits: row.credits,
        money: row.money,
      })),
    },
    catalogHealth: {
      hasCycle: cycles.length > 0,
      cyclePaths: cycles.map((cycle) => cycle.cycleFeatureKeys),
      missingDependencies: graphReport.missingDependencies.filter(
        (row) => row.featureId === featureId,
      ).length,
    },
  };
}
