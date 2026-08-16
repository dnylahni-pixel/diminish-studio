import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  ilike,
  inArray,
  or,
  sql,
} from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  addonPrices,
  addons,
  featurePricingRules,
  features,
  planAddons,
  planChangeRules,
  planCreditPolicies,
  planFeatures,
  planLimits,
  planPrices,
  plans,
  planVersions,
  subscriptions,
} from "@/db/schema";
import type {
  PlanAddonDetail,
  PlanChangeRuleDetail,
  PlanDetailData,
  PlanFeatureDetail,
  PlanListItem,
  PlansFilters,
  PlansListData,
  PlansSearchParams,
  PlanStatus,
  PlanVisibilityFilter,
  PlanListStatusFilter,
  PlanSort,
  SortDirection,
  PlanCreationData,
} from "./types";

const PAGE_SIZE = 20;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const STATUS_FILTERS: PlanListStatusFilter[] = ["all", "active", "draft", "archived"];
const VISIBILITY_FILTERS: PlanVisibilityFilter[] = ["all", "public", "private"];
const SORT_OPTIONS: PlanSort[] = ["order", "name", "updated"];
const DIRECTIONS: SortDirection[] = ["asc", "desc"];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isOneOf<T extends string>(value: string | undefined, options: readonly T[]): value is T {
  return value !== undefined && options.includes(value as T);
}

function toIsoString(value: Date | null | undefined) {
  return value?.toISOString() ?? null;
}

function toCount(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatRelativeTimestamp(value: Date, now = new Date()) {
  const seconds = Math.round((value.getTime() - now.getTime()) / 1000);
  const absoluteSeconds = Math.abs(seconds);

  if (absoluteSeconds < 60) return "just now";

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

export function parsePlansFilters(rawParams: PlansSearchParams): PlansFilters {
  const q = (firstParam(rawParams.q) ?? "").trim().slice(0, 120);
  const requestedStatus = firstParam(rawParams.status);
  const requestedVisibility = firstParam(rawParams.visibility);
  const requestedCurrency = (firstParam(rawParams.currency) ?? "").toUpperCase();
  const requestedSort = firstParam(rawParams.sort);
  const requestedDirection = firstParam(rawParams.direction);
  const requestedPage = Number.parseInt(firstParam(rawParams.page) ?? "1", 10);

  return {
    q,
    status: isOneOf(requestedStatus, STATUS_FILTERS) ? requestedStatus : "all",
    visibility: isOneOf(requestedVisibility, VISIBILITY_FILTERS)
      ? requestedVisibility
      : "all",
    currency: CURRENCY_PATTERN.test(requestedCurrency) ? requestedCurrency : "all",
    sort: isOneOf(requestedSort, SORT_OPTIONS) ? requestedSort : "order",
    direction: isOneOf(requestedDirection, DIRECTIONS)
      ? requestedDirection
      : requestedSort === "updated"
        ? "desc"
        : "asc",
    page: Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    pageSize: PAGE_SIZE,
  };
}

export async function getPlansListData(
  rawParams: PlansSearchParams,
): Promise<PlansListData> {
  const filters = parsePlansFilters(rawParams);
  const conditions: Array<SQL | undefined> = [];

  if (filters.q) {
    const search = `%${filters.q}%`;
    conditions.push(
      or(
        ilike(plans.name, search),
        ilike(plans.code, search),
        ilike(plans.description, search),
      ),
    );
  }

  if (filters.status !== "all") {
    conditions.push(eq(plans.status, filters.status));
  }

  if (filters.visibility !== "all") {
    conditions.push(eq(plans.isPublic, filters.visibility === "public"));
  }

  if (filters.currency !== "all") {
    conditions.push(
      exists(
        db
          .select({ id: planPrices.id })
          .from(planVersions)
          .innerJoin(planPrices, eq(planPrices.planVersionId, planVersions.id))
          .where(
            and(
              eq(planVersions.planId, plans.id),
              eq(planPrices.currency, filters.currency),
              eq(planPrices.isActive, true),
            ),
          ),
      ),
    );
  }

  const whereClause = and(...conditions);
  const sortColumn =
    filters.sort === "name"
      ? plans.name
      : filters.sort === "updated"
        ? plans.updatedAt
        : plans.sortOrder;
  const sortExpression =
    filters.direction === "asc" ? asc(sortColumn) : desc(sortColumn);

  const [
    catalogSummaryRows,
    activeSubscriberRows,
    filteredCountRows,
    currencyRows,
  ] = await Promise.all([
    db
      .select({
        totalPlans: sql<string>`COUNT(*)::text`,
        activePublicPlans: sql<string>`COUNT(*) FILTER (
          WHERE ${plans.status} = 'active' AND ${plans.isPublic} = true
        )::text`,
        draftPlans: sql<string>`COUNT(*) FILTER (
          WHERE ${plans.status} = 'draft'
        )::text`,
      })
      .from(plans),
    db
      .select({ value: count() })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active")),
    db.select({ value: count() }).from(plans).where(whereClause),
    db
      .selectDistinct({ currency: planPrices.currency })
      .from(planPrices)
      .where(eq(planPrices.isActive, true))
      .orderBy(asc(planPrices.currency)),
  ]);

  const totalItems = toCount(filteredCountRows[0]?.value);
  const pageCount = Math.max(1, Math.ceil(totalItems / filters.pageSize));
  const currentPage = Math.min(filters.page, pageCount);
  const offset = (currentPage - 1) * filters.pageSize;

  const planRows = await db
    .select({
      id: plans.id,
      code: plans.code,
      name: plans.name,
      description: plans.description,
      status: plans.status,
      isPublic: plans.isPublic,
      sortOrder: plans.sortOrder,
      updatedAt: plans.updatedAt,
    })
    .from(plans)
    .where(whereClause)
    .orderBy(sortExpression, asc(plans.id))
    .limit(filters.pageSize)
    .offset(offset);

  const planIds = planRows.map((row) => row.id);
  const latestVersionByPlan = new Map<
    string,
    {
      id: string;
      versionNumber: number;
      status: "draft" | "published" | "retired";
      effectiveFrom: Date | null;
    }
  >();

  if (planIds.length > 0) {
    const versionRows = await db
      .select({
        id: planVersions.id,
        planId: planVersions.planId,
        versionNumber: planVersions.versionNumber,
        status: planVersions.status,
        effectiveFrom: planVersions.effectiveFrom,
      })
      .from(planVersions)
      .where(inArray(planVersions.planId, planIds))
      .orderBy(
        asc(planVersions.planId),
        desc(planVersions.versionNumber),
        desc(planVersions.createdAt),
      );

    for (const version of versionRows) {
      if (!latestVersionByPlan.has(version.planId)) {
        latestVersionByPlan.set(version.planId, version);
      }
    }
  }

  const latestVersionIds = [...latestVersionByPlan.values()].map((version) => version.id);
  const priceRows =
    latestVersionIds.length > 0
      ? await db
          .select({
            id: planPrices.id,
            planVersionId: planPrices.planVersionId,
            amount: planPrices.amount,
            currency: planPrices.currency,
            priceType: planPrices.priceType,
            billingInterval: planPrices.billingInterval,
            billingIntervalCount: planPrices.billingIntervalCount,
            trialDays: planPrices.trialDays,
            isDefault: planPrices.isDefault,
            isActive: planPrices.isActive,
          })
          .from(planPrices)
          .where(
            and(
              inArray(planPrices.planVersionId, latestVersionIds),
              eq(planPrices.isActive, true),
            ),
          )
          .orderBy(
            asc(planPrices.planVersionId),
            desc(planPrices.isDefault),
            asc(planPrices.currency),
            asc(planPrices.amount),
          )
      : [];

  const subscriptionCurrency = sql<string>`COALESCE(
    ${planPrices.currency},
    ${subscriptions.currency},
    'UNSPECIFIED'
  )`;
  const monthlyRevenue = sql<string>`COALESCE(SUM(
    CASE
      WHEN ${planPrices.priceType} <> 'recurring' THEN 0
      WHEN ${planPrices.billingInterval} = 'year'
        THEN ${planPrices.amount} / (12.0 * COALESCE(NULLIF(${planPrices.billingIntervalCount}, 0), 1))
      WHEN ${planPrices.billingInterval} = 'month'
        THEN ${planPrices.amount} / COALESCE(NULLIF(${planPrices.billingIntervalCount}, 0), 1)
      WHEN ${planPrices.billingInterval} = 'week'
        THEN (${planPrices.amount} * 52.0) / (12.0 * COALESCE(NULLIF(${planPrices.billingIntervalCount}, 0), 1))
      WHEN ${planPrices.billingInterval} = 'day'
        THEN (${planPrices.amount} * 365.0) / (12.0 * COALESCE(NULLIF(${planPrices.billingIntervalCount}, 0), 1))
      ELSE 0
    END
  ), 0)::bigint::text`;

  const subscriptionRows =
    planIds.length > 0
      ? await db
          .select({
            planId: subscriptions.planId,
            currency: subscriptionCurrency,
            activeSubscriptions: sql<string>`COUNT(*)::text`,
            amount: monthlyRevenue,
          })
          .from(subscriptions)
          .leftJoin(planPrices, eq(subscriptions.planPriceId, planPrices.id))
          .where(
            and(
              inArray(subscriptions.planId, planIds),
              eq(subscriptions.status, "active"),
            ),
          )
          .groupBy(subscriptions.planId, subscriptionCurrency)
      : [];

  const pricesByVersion = new Map<string, PlanListItem["prices"]>();

  for (const price of priceRows) {
    const versionPrices = pricesByVersion.get(price.planVersionId) ?? [];
    versionPrices.push({
      id: price.id,
      amount: String(price.amount),
      currency: price.currency,
      priceType: price.priceType,
      billingInterval: price.billingInterval,
      billingIntervalCount: price.billingIntervalCount,
      trialDays: price.trialDays,
      isDefault: price.isDefault,
      isActive: price.isActive,
    });
    pricesByVersion.set(price.planVersionId, versionPrices);
  }

  const subscriptionsByPlan = new Map<
    string,
    { count: number; revenue: PlanListItem["recurringRevenue"] }
  >();

  for (const row of subscriptionRows) {
    const current = subscriptionsByPlan.get(row.planId) ?? { count: 0, revenue: [] };
    const activeSubscriptions = toCount(row.activeSubscriptions);
    current.count += activeSubscriptions;
    current.revenue.push({
      amount: row.amount,
      currency: row.currency,
      activeSubscriptions,
    });
    subscriptionsByPlan.set(row.planId, current);
  }

  const now = new Date();
  const items: PlanListItem[] = planRows.map((plan) => {
    const version = latestVersionByPlan.get(plan.id);
    const versionPrices = version ? (pricesByVersion.get(version.id) ?? []) : [];
    const defaultPrice =
      versionPrices.find((price) => price.isDefault && price.isActive) ??
      versionPrices.find((price) => price.isActive) ??
      null;
    const subscriptionData = subscriptionsByPlan.get(plan.id);

    return {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      status: plan.status,
      isPublic: plan.isPublic,
      sortOrder: plan.sortOrder,
      updatedAt: plan.updatedAt.toISOString(),
      updatedRelative: formatRelativeTimestamp(plan.updatedAt, now),
      currentVersion: version
        ? {
            id: version.id,
            versionNumber: version.versionNumber,
            status: version.status,
            effectiveFrom: toIsoString(version.effectiveFrom),
          }
        : null,
      prices: versionPrices,
      defaultPrice,
      hasMultipleCurrencies:
        new Set(versionPrices.map((price) => price.currency)).size > 1,
      activeSubscribers: subscriptionData?.count ?? 0,
      recurringRevenue: subscriptionData?.revenue ?? [],
    };
  });

  const summary = catalogSummaryRows[0];

  return {
    filters: { ...filters, page: currentPage },
    summary: {
      totalPlans: toCount(summary?.totalPlans),
      activePublicPlans: toCount(summary?.activePublicPlans),
      draftPlans: toCount(summary?.draftPlans),
      activeSubscribers: toCount(activeSubscriberRows[0]?.value),
    },
    items,
    currencies: currencyRows
      .map((row) => row.currency.toUpperCase())
      .filter((currency) => CURRENCY_PATTERN.test(currency)),
    totalItems,
    pageCount,
  };
}

export async function getPlanCreationData(): Promise<PlanCreationData> {
  const [featureRows, addonRows, sourcePlanRows, sortOrderRows] = await Promise.all([
    db
      .select({
        id: features.id,
        code: features.code,
        name: features.name,
        description: features.description,
        kind: features.kind,
        unitName: features.unitName,
      })
      .from(features)
      .where(eq(features.isActive, true))
      .orderBy(asc(features.name), asc(features.code)),
    db
      .select({
        id: addons.id,
        code: addons.code,
        name: addons.name,
        description: addons.description,
        scope: addons.scope,
      })
      .from(addons)
      .where(eq(addons.isActive, true))
      .orderBy(asc(addons.name), asc(addons.code)),
    db
      .select({
        id: plans.id,
        code: plans.code,
        name: plans.name,
        status: plans.status,
        versionNumber: sql<number | null>`(
          SELECT MAX(${planVersions.versionNumber})
          FROM ${planVersions}
          WHERE ${planVersions.planId} = ${plans.id}
        )`,
      })
      .from(plans)
      .where(or(eq(plans.status, "active"), eq(plans.status, "draft")))
      .orderBy(asc(plans.name), asc(plans.code)),
    db
      .select({
        value: sql<number>`COALESCE(MAX(${plans.sortOrder}), -10) + 10`,
      })
      .from(plans),
  ]);

  return {
    features: featureRows,
    addons: addonRows,
    sourcePlans: sourcePlanRows.map((plan) => ({
      ...plan,
      versionNumber:
        plan.versionNumber === null ? null : Number(plan.versionNumber),
    })),
    suggestedSortOrder: Number(sortOrderRows[0]?.value ?? 0),
  };
}

export async function getPlanDetail(planId: string): Promise<PlanDetailData | null> {
  const planRows = await db
    .select({
      id: plans.id,
      code: plans.code,
      name: plans.name,
      description: plans.description,
      status: plans.status,
      isPublic: plans.isPublic,
      sortOrder: plans.sortOrder,
      createdAt: plans.createdAt,
      updatedAt: plans.updatedAt,
    })
    .from(plans)
    .where(eq(plans.id, planId))
    .limit(1);

  const plan = planRows[0];
  if (!plan) return null;

  const versionRows = await db
    .select({
      id: planVersions.id,
      versionNumber: planVersions.versionNumber,
      status: planVersions.status,
      title: planVersions.title,
      effectiveFrom: planVersions.effectiveFrom,
      effectiveTo: planVersions.effectiveTo,
      changeNotes: planVersions.changeNotes,
      createdAt: planVersions.createdAt,
    })
    .from(planVersions)
    .where(eq(planVersions.planId, planId))
    .orderBy(desc(planVersions.versionNumber), desc(planVersions.createdAt));

  const versionIds = versionRows.map((version) => version.id);
  const pricePromise =
    versionIds.length > 0
      ? db
          .select({
            id: planPrices.id,
            planVersionId: planPrices.planVersionId,
            amount: planPrices.amount,
            currency: planPrices.currency,
            priceType: planPrices.priceType,
            billingInterval: planPrices.billingInterval,
            billingIntervalCount: planPrices.billingIntervalCount,
            trialDays: planPrices.trialDays,
            isDefault: planPrices.isDefault,
            isActive: planPrices.isActive,
          })
          .from(planPrices)
          .where(inArray(planPrices.planVersionId, versionIds))
          .orderBy(
            asc(planPrices.planVersionId),
            desc(planPrices.isDefault),
            asc(planPrices.currency),
            asc(planPrices.amount),
          )
      : Promise.resolve([]);
  const featurePromise =
    versionIds.length > 0
      ? db
          .select({
            id: planFeatures.id,
            planVersionId: planFeatures.planVersionId,
            featureId: planFeatures.featureId,
            code: features.code,
            name: features.name,
            description: features.description,
            kind: features.kind,
            unitName: features.unitName,
            isIncluded: planFeatures.isIncluded,
            config: planFeatures.config,
          })
          .from(planFeatures)
          .innerJoin(features, eq(planFeatures.featureId, features.id))
          .where(inArray(planFeatures.planVersionId, versionIds))
          .orderBy(asc(features.name))
      : Promise.resolve([]);
  const limitPromise =
    versionIds.length > 0
      ? db
          .select({
            id: planLimits.id,
            planVersionId: planLimits.planVersionId,
            featureId: planLimits.featureId,
            limitValue: planLimits.limitValue,
            period: planLimits.period,
            behavior: planLimits.behavior,
            overageUnitPrice: planLimits.overageUnitPrice,
          })
          .from(planLimits)
          .where(inArray(planLimits.planVersionId, versionIds))
          .orderBy(asc(planLimits.period))
      : Promise.resolve([]);
  const pricingRulePromise =
    versionIds.length > 0
      ? db
          .select({
            id: featurePricingRules.id,
            planVersionId: featurePricingRules.planVersionId,
            featureId: featurePricingRules.featureId,
            metric: featurePricingRules.metric,
            pricingModel: featurePricingRules.pricingModel,
            currency: featurePricingRules.currency,
            unitPrice: featurePricingRules.unitPrice,
            tiers: featurePricingRules.tiers,
            creditCostPerUnit: featurePricingRules.creditCostPerUnit,
            minimumCharge: featurePricingRules.minimumCharge,
            isActive: featurePricingRules.isActive,
          })
          .from(featurePricingRules)
          .where(inArray(featurePricingRules.planVersionId, versionIds))
          .orderBy(asc(featurePricingRules.metric))
      : Promise.resolve([]);
  const creditPolicyPromise =
    versionIds.length > 0
      ? db
          .select({
            id: planCreditPolicies.id,
            planVersionId: planCreditPolicies.planVersionId,
            monthlyCreditGrant: planCreditPolicies.monthlyCreditGrant,
            rolloverEnabled: planCreditPolicies.rolloverEnabled,
            rolloverCap: planCreditPolicies.rolloverCap,
            resetPolicy: planCreditPolicies.resetPolicy,
            grantExpiryDays: planCreditPolicies.grantExpiryDays,
            negativeBalanceAllowed: planCreditPolicies.negativeBalanceAllowed,
            maxNegativeBalance: planCreditPolicies.maxNegativeBalance,
          })
          .from(planCreditPolicies)
          .where(inArray(planCreditPolicies.planVersionId, versionIds))
      : Promise.resolve([]);

  const [
    priceRows,
    featureRows,
    limitRows,
    pricingRuleRows,
    creditPolicyRows,
    addonRows,
    changeRuleRows,
    subscriptionRows,
  ] = await Promise.all([
    pricePromise,
    featurePromise,
    limitPromise,
    pricingRulePromise,
    creditPolicyPromise,
    db
      .select({
        id: planAddons.id,
        addonId: planAddons.addonId,
        code: addons.code,
        name: addons.name,
        description: addons.description,
        scope: addons.scope,
        isActive: addons.isActive,
        isDefault: planAddons.isDefault,
        isRequired: planAddons.isRequired,
      })
      .from(planAddons)
      .innerJoin(addons, eq(planAddons.addonId, addons.id))
      .where(eq(planAddons.planId, planId))
      .orderBy(asc(addons.name)),
    db
      .select({
        id: planChangeRules.id,
        fromPlanId: planChangeRules.fromPlanId,
        toPlanId: planChangeRules.toPlanId,
        prorationMode: planChangeRules.prorationMode,
        allowChange: planChangeRules.allowChange,
        carryUnusedCredits: planChangeRules.carryUnusedCredits,
        changeFeeAmount: planChangeRules.changeFeeAmount,
        currency: planChangeRules.currency,
        ruleConfig: planChangeRules.ruleConfig,
      })
      .from(planChangeRules)
      .where(
        or(
          eq(planChangeRules.fromPlanId, planId),
          eq(planChangeRules.toPlanId, planId),
        ),
      ),
    db
      .select({
        planVersionId: subscriptions.planVersionId,
        status: subscriptions.status,
        value: count(),
      })
      .from(subscriptions)
      .where(eq(subscriptions.planId, planId))
      .groupBy(subscriptions.planVersionId, subscriptions.status),
  ]);

  const addonIds = addonRows.map((addon) => addon.addonId);
  const relatedPlanIds = [
    ...new Set(
      changeRuleRows.map((rule) =>
        rule.fromPlanId === planId ? rule.toPlanId : rule.fromPlanId,
      ),
    ),
  ];

  const [addonPriceRows, relatedPlanRows] = await Promise.all([
    addonIds.length > 0
      ? db
          .select({
            id: addonPrices.id,
            addonId: addonPrices.addonId,
            amount: addonPrices.amount,
            currency: addonPrices.currency,
            priceType: addonPrices.priceType,
            billingInterval: addonPrices.billingInterval,
            billingIntervalCount: addonPrices.billingIntervalCount,
            isActive: addonPrices.isActive,
          })
          .from(addonPrices)
          .where(inArray(addonPrices.addonId, addonIds))
          .orderBy(
            asc(addonPrices.addonId),
            desc(addonPrices.isActive),
            asc(addonPrices.currency),
            asc(addonPrices.amount),
          )
      : Promise.resolve([]),
    relatedPlanIds.length > 0
      ? db
          .select({
            id: plans.id,
            code: plans.code,
            name: plans.name,
            status: plans.status,
          })
          .from(plans)
          .where(inArray(plans.id, relatedPlanIds))
      : Promise.resolve([]),
  ]);

  const versions = versionRows.map((version) => ({
    id: version.id,
    versionNumber: version.versionNumber,
    status: version.status,
    title: version.title,
    effectiveFrom: toIsoString(version.effectiveFrom),
    effectiveTo: toIsoString(version.effectiveTo),
    changeNotes: version.changeNotes,
    createdAt: version.createdAt.toISOString(),
  }));
  const now = Date.now();
  const currentVersion =
    versions.find(
      (version) =>
        version.status === "published" &&
        (!version.effectiveFrom || new Date(version.effectiveFrom).getTime() <= now) &&
        (!version.effectiveTo || new Date(version.effectiveTo).getTime() > now),
    ) ??
    versions.find((version) => version.status === "published") ??
    null;
  const configurationVersion = currentVersion ?? versions[0] ?? null;

  const prices = priceRows.map((price) => ({
    id: price.id,
    planVersionId: price.planVersionId,
    amount: String(price.amount),
    currency: price.currency,
    priceType: price.priceType,
    billingInterval: price.billingInterval,
    billingIntervalCount: price.billingIntervalCount,
    trialDays: price.trialDays,
    isDefault: price.isDefault,
    isActive: price.isActive,
  }));
  const limits = limitRows.map((limit) => ({
    id: limit.id,
    planVersionId: limit.planVersionId,
    featureId: limit.featureId,
    limitValue: limit.limitValue === null ? null : String(limit.limitValue),
    period: limit.period,
    behavior: limit.behavior,
    overageUnitPrice:
      limit.overageUnitPrice === null ? null : String(limit.overageUnitPrice),
  }));
  const pricingRules = pricingRuleRows.map((rule) => ({
    id: rule.id,
    planVersionId: rule.planVersionId,
    featureId: rule.featureId,
    metric: rule.metric,
    pricingModel: rule.pricingModel,
    currency: rule.currency,
    unitPrice: rule.unitPrice === null ? null : String(rule.unitPrice),
    tiers: rule.tiers ?? [],
    creditCostPerUnit:
      rule.creditCostPerUnit === null ? null : String(rule.creditCostPerUnit),
    minimumCharge:
      rule.minimumCharge === null ? null : String(rule.minimumCharge),
    isActive: rule.isActive,
  }));
  const featuresByVersion: PlanFeatureDetail[] = featureRows.map((feature) => ({
    id: feature.id,
    planVersionId: feature.planVersionId,
    featureId: feature.featureId,
    code: feature.code,
    name: feature.name,
    description: feature.description,
    kind: feature.kind,
    unitName: feature.unitName,
    isIncluded: feature.isIncluded,
    config: feature.config ?? {},
    limits: limits.filter(
      (limit) =>
        limit.planVersionId === feature.planVersionId &&
        limit.featureId === feature.featureId,
    ),
    pricingRules: pricingRules.filter(
      (rule) =>
        rule.planVersionId === feature.planVersionId &&
        rule.featureId === feature.featureId,
    ),
  }));
  const creditPolicies = creditPolicyRows.map((policy) => ({
    id: policy.id,
    planVersionId: policy.planVersionId,
    monthlyCreditGrant: String(policy.monthlyCreditGrant),
    rolloverEnabled: policy.rolloverEnabled,
    rolloverCap: policy.rolloverCap === null ? null : String(policy.rolloverCap),
    resetPolicy: policy.resetPolicy,
    grantExpiryDays: policy.grantExpiryDays,
    negativeBalanceAllowed: policy.negativeBalanceAllowed,
    maxNegativeBalance:
      policy.maxNegativeBalance === null ? null : String(policy.maxNegativeBalance),
  }));

  const pricesByAddon = new Map<string, PlanAddonDetail["prices"]>();

  for (const price of addonPriceRows) {
    const values = pricesByAddon.get(price.addonId) ?? [];
    values.push({
      id: price.id,
      amount: String(price.amount),
      currency: price.currency,
      priceType: price.priceType,
      billingInterval: price.billingInterval,
      billingIntervalCount: price.billingIntervalCount,
      isActive: price.isActive,
    });
    pricesByAddon.set(price.addonId, values);
  }

  const addonDetails: PlanAddonDetail[] = addonRows.map((addon) => ({
    id: addon.id,
    addonId: addon.addonId,
    code: addon.code,
    name: addon.name,
    description: addon.description,
    scope: addon.scope,
    isActive: addon.isActive,
    isDefault: addon.isDefault,
    isRequired: addon.isRequired,
    prices: pricesByAddon.get(addon.addonId) ?? [],
  }));

  const relatedPlanById = new Map(relatedPlanRows.map((relatedPlan) => [relatedPlan.id, relatedPlan]));
  const changeRules: PlanChangeRuleDetail[] = changeRuleRows.flatMap((rule) => {
    const direction = rule.fromPlanId === planId ? "outbound" : "inbound";
    const relatedPlanId =
      direction === "outbound" ? rule.toPlanId : rule.fromPlanId;
    const relatedPlan = relatedPlanById.get(relatedPlanId);

    if (!relatedPlan) return [];

    return [
      {
        id: rule.id,
        direction,
        relatedPlanId,
        relatedPlanCode: relatedPlan.code,
        relatedPlanName: relatedPlan.name,
        relatedPlanStatus: relatedPlan.status as PlanStatus,
        prorationMode: rule.prorationMode,
        allowChange: rule.allowChange,
        carryUnusedCredits: rule.carryUnusedCredits,
        changeFeeAmount:
          rule.changeFeeAmount === null ? null : String(rule.changeFeeAmount),
        currency: rule.currency,
        ruleConfig: rule.ruleConfig ?? {},
      },
    ];
  });
  const versionNumberById = new Map(
    versions.map((version) => [version.id, version.versionNumber]),
  );
  const subscriptionBreakdown = subscriptionRows.map((row) => ({
    planVersionId: row.planVersionId,
    versionNumber: versionNumberById.get(row.planVersionId) ?? null,
    status: row.status,
    count: toCount(row.value),
  }));
  const activeSubscribers = subscriptionBreakdown
    .filter((item) => item.status === "active")
    .reduce((total, item) => total + item.count, 0);
  const defaultPrice =
    prices.find(
      (price) =>
        price.planVersionId === configurationVersion?.id &&
        price.isActive &&
        price.isDefault,
    ) ??
    prices.find(
      (price) =>
        price.planVersionId === configurationVersion?.id && price.isActive,
    ) ??
    null;
  const monthlyCreditGrant =
    creditPolicies.find(
      (policy) => policy.planVersionId === configurationVersion?.id,
    )?.monthlyCreditGrant ?? null;

  return {
    plan: {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      status: plan.status,
      isPublic: plan.isPublic,
      sortOrder: plan.sortOrder,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    },
    versions,
    currentVersion,
    configurationVersion,
    prices,
    features: featuresByVersion,
    creditPolicies,
    addons: addonDetails,
    changeRules,
    subscriptionBreakdown,
    activeSubscribers,
    defaultPrice,
    monthlyCreditGrant,
  };
}
