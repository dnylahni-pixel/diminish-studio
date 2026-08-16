"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { db, sqlClient } from "@/db";
import {
  addons,
  featurePricingRules,
  features,
  planAddons,
  planCreditPolicies,
  planFeatures,
  planLimits,
  planPrices,
  plans,
  planVersions,
} from "@/db/schema";
import { defaultLocale, isLocale } from "@/i18n/config";
import { translate, type PlansKey } from "@/i18n/plans";
import type {
  CreateDraftVersionInput,
  CreatePlanInput,
  CreditWindow,
  PlanPolicyActionState,
  PlanCrudActionState,
  PublishVersionInput,
  SavePlanFeaturePolicyInput,
  UpdatePlanInput,
} from "./types";

type VersionRow = {
  id: string;
  planId: string;
  status: "draft" | "published" | "retired";
  title: string | null;
  changeNotes: string | null;
  metadata: unknown;
};

function localeFromInput(locale: string | undefined): "fa" | "en" {
  return isLocale(locale) ? locale : defaultLocale;
}

function errorState(
  locale: "fa" | "en",
  key: PlansKey,
): PlanPolicyActionState {
  return {
    status: "error",
    message: translate(locale, key),
    fieldErrors: {},
  };
}

function crudErrorState(
  locale: "fa" | "en",
  key: PlansKey,
  fieldErrors: Record<string, string[] | undefined> = {},
): PlanCrudActionState {
  return {
    status: "error",
    message: translate(locale, key),
    fieldErrors,
  };
}

async function nextVersionNumber(planId: string): Promise<number> {
  const rows = await db
    .select({ versionNumber: planVersions.versionNumber })
    .from(planVersions)
    .where(eq(planVersions.planId, planId));
  return (
    rows.reduce((max, row) => Math.max(max, row.versionNumber), 0) + 1
  );
}

async function loadSourceVersion(versionId: string): Promise<VersionRow | null> {
  const rows = await db
    .select({
      id: planVersions.id,
      planId: planVersions.planId,
      status: planVersions.status,
      title: planVersions.title,
      changeNotes: planVersions.changeNotes,
      metadata: planVersions.metadata,
    })
    .from(planVersions)
    .where(eq(planVersions.id, versionId))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Build INSERT statements that copy every policy row of `sourceVersionId`
 * into `newVersionId`, skipping `excludedFeatureId` when provided.
 */
async function copyVersionPolicies(
  newVersionId: string,
  sourceVersionId: string,
  excludedFeatureId?: string,
) {
  const [featureRows, limitRows, pricingRows] = await Promise.all([
    db
      .select({
        featureId: planFeatures.featureId,
        isIncluded: planFeatures.isIncluded,
        config: planFeatures.config,
      })
      .from(planFeatures)
      .where(eq(planFeatures.planVersionId, sourceVersionId)),
    db
      .select({
        featureId: planLimits.featureId,
        limitValue: planLimits.limitValue,
        period: planLimits.period,
        behavior: planLimits.behavior,
        overageUnitPrice: planLimits.overageUnitPrice,
        metadata: planLimits.metadata,
      })
      .from(planLimits)
      .where(eq(planLimits.planVersionId, sourceVersionId)),
    db
      .select({
        featureId: featurePricingRules.featureId,
        metric: featurePricingRules.metric,
        pricingModel: featurePricingRules.pricingModel,
        currency: featurePricingRules.currency,
        unitPrice: featurePricingRules.unitPrice,
        tiers: featurePricingRules.tiers,
        creditCostPerUnit: featurePricingRules.creditCostPerUnit,
        minimumCharge: featurePricingRules.minimumCharge,
        isActive: featurePricingRules.isActive,
        metadata: featurePricingRules.metadata,
      })
      .from(featurePricingRules)
      .where(eq(featurePricingRules.planVersionId, sourceVersionId)),
  ]);

  return [
    ...featureRows
      .filter((row) => row.featureId !== excludedFeatureId)
      .map(
        (row) => sqlClient`
          INSERT INTO plan_features (
            id, plan_version_id, feature_id, is_included, config
          ) VALUES (
            ${crypto.randomUUID()},
            ${newVersionId},
            ${row.featureId},
            ${row.isIncluded},
            ${JSON.stringify(row.config ?? {})}::jsonb
          )
        `,
      ),
    ...limitRows
      .filter((row) => row.featureId !== excludedFeatureId)
      .map(
        (row) => sqlClient`
          INSERT INTO plan_limits (
            id, plan_version_id, feature_id, limit_value, period,
            behavior, overage_unit_price, metadata
          ) VALUES (
            ${crypto.randomUUID()},
            ${newVersionId},
            ${row.featureId},
            ${row.limitValue},
            ${row.period},
            ${row.behavior},
            ${row.overageUnitPrice},
            ${JSON.stringify(row.metadata ?? {})}::jsonb
          )
        `,
      ),
    ...pricingRows
      .filter((row) => row.featureId !== excludedFeatureId)
      .map(
        (row) => sqlClient`
          INSERT INTO feature_pricing_rules (
            id, plan_version_id, feature_id, metric, pricing_model,
            currency, unit_price, tiers, credit_cost_per_unit,
            minimum_charge, is_active, metadata
          ) VALUES (
            ${crypto.randomUUID()},
            ${newVersionId},
            ${row.featureId},
            ${row.metric},
            ${row.pricingModel},
            ${row.currency},
            ${row.unitPrice},
            ${JSON.stringify(row.tiers ?? [])}::jsonb,
            ${row.creditCostPerUnit},
            ${row.minimumCharge},
            ${row.isActive},
            ${JSON.stringify(row.metadata ?? {})}::jsonb
          )
        `,
      ),
  ];
}

function newVersionInsertQuery(
  newVersionId: string,
  planId: string,
  versionNumber: number,
  source: VersionRow,
) {
  return sqlClient`
    INSERT INTO plan_versions (
      id, plan_id, version_number, status, title, effective_from,
      effective_to, change_notes, metadata
    ) VALUES (
      ${newVersionId},
      ${planId},
      ${versionNumber},
      'draft',
      ${source.title},
      NULL,
      NULL,
      ${source.changeNotes},
      ${JSON.stringify(source.metadata ?? {})}::jsonb
    )
  `;
}

/**
 * Save the policy of one feature by branching into a NEW draft version.
 *
 * The source version is never mutated: a draft version `v+1` is created with
 * every policy copied from the source, then the edited feature's policy is
 * applied to that new draft atomically.
 */
export async function savePlanFeaturePolicy(
  input: SavePlanFeaturePolicyInput,
): Promise<PlanPolicyActionState> {
  const activeLocale = localeFromInput(input.locale);
  const t = (key: PlansKey) => translate(activeLocale, key);

  const policySchema = z
    .object({
      planVersionId: z.string().uuid(),
      featureId: z.string().uuid(),
      accessMode: z.enum(["inherit", "allow", "deny"]),
      limitMode: z.enum(["unlimited", "custom"]),
      limitValue: z.string().trim(),
      period: z.enum(["none", "day", "week", "month"]),
      behavior: z.enum(["block", "allow_overage"]),
      overageUnitPrice: z.string().trim(),
      pricingMode: z.enum(["free", "custom"]),
      metric: z.enum(["unit", "minute", "megabyte", "request", "seat"]),
      pricingModel: z.enum(["flat", "tiered", "volume"]),
      currency: z.string().trim().toUpperCase(),
      unitPrice: z.string().trim(),
      creditCostPerUnit: z.string().trim(),
      minimumCharge: z.string().trim(),
      locale: z.enum(["fa", "en"]),
    })
    .superRefine((value, context) => {
      if (value.limitMode === "custom") {
        if (!/^\d+$/.test(value.limitValue)) {
          context.addIssue({
            code: "custom",
            path: ["limitValue"],
            message: t("errors.limitWhole"),
          });
        }
        if (
          value.behavior === "allow_overage" &&
          value.overageUnitPrice !== "" &&
          !/^\d+$/.test(value.overageUnitPrice)
        ) {
          context.addIssue({
            code: "custom",
            path: ["overageUnitPrice"],
            message: t("errors.overageWhole"),
          });
        }
      }

      if (value.pricingMode === "custom") {
        if (!/^[A-Z]{3}$/.test(value.currency)) {
          context.addIssue({
            code: "custom",
            path: ["currency"],
            message: t("errors.currency"),
          });
        }
        for (const field of [
          "unitPrice",
          "creditCostPerUnit",
          "minimumCharge",
        ] as const) {
          if (value[field] !== "" && !/^\d+$/.test(value[field])) {
            context.addIssue({
              code: "custom",
              path: [field],
              message: t("errors.priceWhole"),
            });
          }
        }
      }
    });

  const parsed = policySchema.safeParse(input);
  if (!parsed.success) {
    const flattened = parsed.error.flatten() as {
      formErrors: string[];
      fieldErrors: Record<string, string[] | undefined>;
    };
    return {
      status: "error",
      message: t("errors.reviewFields"),
      fieldErrors: {
        ...flattened.fieldErrors,
        ...(flattened.formErrors.length > 0
          ? { value: flattened.formErrors }
          : {}),
      },
    };
  }

  const {
    planVersionId,
    featureId,
    accessMode,
    limitMode,
    limitValue,
    period,
    behavior,
    overageUnitPrice,
    pricingMode,
    metric,
    pricingModel,
    currency,
    unitPrice,
    creditCostPerUnit,
    minimumCharge,
  } = parsed.data;

  const [version, featureRows] = await Promise.all([
    loadSourceVersion(planVersionId),
    db
      .select({ id: features.id })
      .from(features)
      .where(eq(features.id, featureId))
      .limit(1),
  ]);

  if (!version || featureRows.length === 0) {
    return errorState(activeLocale, "errors.notFound");
  }

  const planRows = await db
    .select({ id: plans.id })
    .from(plans)
    .where(eq(plans.id, version.planId))
    .limit(1);
  if (planRows.length === 0) {
    return errorState(activeLocale, "errors.notFound");
  }

  const newVersionId = crypto.randomUUID();
  const versionNumber = await nextVersionNumber(version.planId);

  const copiedQueries = await copyVersionPolicies(
    newVersionId,
    planVersionId,
    featureId,
  );

  const queries = [
    newVersionInsertQuery(newVersionId, version.planId, versionNumber, version),
    ...copiedQueries,
    ...(accessMode !== "inherit"
      ? [
          sqlClient`
            INSERT INTO plan_features (
              id, plan_version_id, feature_id, is_included, config
            ) VALUES (
              ${crypto.randomUUID()},
              ${newVersionId},
              ${featureId},
              ${accessMode === "allow"},
              ${JSON.stringify({})}::jsonb
            )
          `,
        ]
      : []),
    ...(limitMode === "custom"
      ? [
          sqlClient`
            INSERT INTO plan_limits (
              id, plan_version_id, feature_id, limit_value, period,
              behavior, overage_unit_price, metadata
            ) VALUES (
              ${crypto.randomUUID()},
              ${newVersionId},
              ${featureId},
              ${Number(limitValue)},
              ${period},
              ${behavior},
              ${
                behavior === "allow_overage" && overageUnitPrice !== ""
                  ? Number(overageUnitPrice)
                  : null
              },
              ${JSON.stringify({})}::jsonb
            )
          `,
        ]
      : []),
    ...(pricingMode === "custom"
      ? [
          sqlClient`
            INSERT INTO feature_pricing_rules (
              id, plan_version_id, feature_id, metric, pricing_model,
              currency, unit_price, tiers, credit_cost_per_unit,
              minimum_charge, is_active, metadata
            ) VALUES (
              ${crypto.randomUUID()},
              ${newVersionId},
              ${featureId},
              ${metric},
              ${pricingModel},
              ${currency},
              ${unitPrice !== "" ? Number(unitPrice) : null},
              ${JSON.stringify([])}::jsonb,
              ${creditCostPerUnit !== "" ? Number(creditCostPerUnit) : null},
              ${minimumCharge !== "" ? Number(minimumCharge) : null},
              true,
              ${JSON.stringify({})}::jsonb
            )
          `,
        ]
      : []),
  ];

  try {
    await sqlClient.transaction(queries);
  } catch (error) {
    return errorState(activeLocale, "errors.commitFailed");
  }

  revalidatePath("/lab");
  return {
    status: "success",
    message: t("actions.saved"),
    fieldErrors: {},
    versionId: newVersionId,
    versionNumber,
  };
}

/**
 * Create a new draft version by copying an existing version and all of its
 * policies. The source version is left untouched.
 */
export async function createDraftVersion(
  input: CreateDraftVersionInput,
): Promise<PlanPolicyActionState> {
  const activeLocale = localeFromInput(input.locale);

  const schema = z.object({
    planId: z.string().uuid(),
    sourceVersionId: z.string().uuid(),
    locale: z.enum(["fa", "en"]),
  });
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return errorState(activeLocale, "errors.reviewFields");
  }

  const { planId, sourceVersionId } = parsed.data;
  const [planRows, source] = await Promise.all([
    db
      .select({ id: plans.id })
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1),
    loadSourceVersion(sourceVersionId),
  ]);

  if (planRows.length === 0 || !source || source.planId !== planId) {
    return errorState(activeLocale, "errors.versionNotFound");
  }

  const newVersionId = crypto.randomUUID();
  const versionNumber = await nextVersionNumber(planId);
  const copiedQueries = await copyVersionPolicies(
    newVersionId,
    sourceVersionId,
  );

  try {
    await sqlClient.transaction([
      newVersionInsertQuery(newVersionId, planId, versionNumber, source),
      ...copiedQueries,
    ]);
  } catch (error) {
    return errorState(activeLocale, "errors.commitFailed");
  }

  revalidatePath("/lab");
  return {
    status: "success",
    message: translate(activeLocale, "actions.createdDraft"),
    fieldErrors: {},
    versionId: newVersionId,
    versionNumber,
  };
}

/**
 * Publish a draft version. Other published versions of the same plan are
 * retired in the same transaction so only one published version remains.
 */
export async function publishVersion(
  input: PublishVersionInput,
): Promise<PlanPolicyActionState> {
  const activeLocale = localeFromInput(input.locale);

  const schema = z.object({
    planId: z.string().uuid(),
    versionId: z.string().uuid(),
    locale: z.enum(["fa", "en"]),
  });
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return errorState(activeLocale, "errors.reviewFields");
  }

  const { planId, versionId } = parsed.data;
  const [planRows, version] = await Promise.all([
    db
      .select({ id: plans.id })
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1),
    loadSourceVersion(versionId),
  ]);

  if (planRows.length === 0 || !version || version.planId !== planId) {
    return errorState(activeLocale, "errors.versionNotFound");
  }
  if (version.status !== "draft") {
    return errorState(activeLocale, "errors.notDraft");
  }

  try {
    await sqlClient.transaction([
      sqlClient`
        UPDATE plan_versions
        SET status = 'published', updated_at = NOW()
        WHERE id = ${versionId}
      `,
      sqlClient`
        UPDATE plan_versions
        SET status = 'retired', updated_at = NOW()
        WHERE plan_id = ${planId}
          AND id <> ${versionId}
          AND status = 'published'
      `,
    ]);
  } catch (error) {
    return errorState(activeLocale, "errors.commitFailed");
  }

  revalidatePath("/lab");
  return {
    status: "success",
    message: translate(activeLocale, "actions.published"),
    fieldErrors: {},
  };
}

const PLAN_CODE_PATTERN = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

function toMinorUnits(value: string) {
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

/**
 * Map the multi-window credit list onto the legacy single-row columns so
 * existing runtime/governance code keeps a sane value. The full window list is
 * stored in `plan_credit_policies.metadata.creditWindows`.
 */
function legacyCreditFields(windows: CreditWindow[]) {
  const total = windows.find((window) => window.period === "total");
  const monthly = windows.find(
    (window) => window.period === "month" && window.periodCount === 1,
  );
  const primary = total ?? monthly;
  const monthlyCreditGrant = primary?.creditAmount ?? 0;
  const resetPolicy =
    primary?.period === "total" || primary?.period === "month"
      ? ("monthly" as const)
      : primary?.period === "week"
        ? ("weekly" as const)
        : primary?.period === "day"
          ? ("daily" as const)
          : ("none" as const);
  return { monthlyCreditGrant, resetPolicy };
}

function parseCreditWindows(metadata: unknown): CreditWindow[] {
  const raw =
    metadata && typeof metadata === "object"
      ? (metadata as { creditWindows?: unknown }).creditWindows
      : undefined;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (entry): entry is Record<string, unknown> =>
        !!entry && typeof entry === "object",
    )
    .map((entry) => ({
      id: String(entry.id ?? crypto.randomUUID()),
      period: (
        ["hour", "day", "week", "month", "year", "total"] as const
      ).includes(entry.period as CreditWindow["period"])
        ? (entry.period as CreditWindow["period"])
        : "month",
      periodCount: Number(entry.periodCount ?? 1) || 1,
      creditAmount: Number(entry.creditAmount ?? 0) || 0,
    }));
}

function nextCloneCode(existingCodes: string[], base: string) {
  const taken = new Set(existingCodes);
  let candidate = base;
  let suffix = 2;
  while (taken.has(candidate)) {
    candidate = suffix === 2 ? `${base}-2` : `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function planConstraintMessage(error: unknown, locale: "fa" | "en") {
  const details =
    error instanceof Error
      ? `${error.message} ${String((error as { cause?: unknown }).cause ?? "")}`
      : String(error);
  if (
    details.includes("plans_code_unique") ||
    details.includes("duplicate key") ||
    details.includes("uq_plan_version")
  ) {
    return translate(locale, "errors.codeInUse");
  }
  return translate(locale, "errors.commitFailed");
}

/**
 * Create a plan and its first version (v1) in one transaction, including the
 * base price, credit policy, selected features and addons. When
 * `creationMode` is `clone`, the latest version of the source plan is copied
 * first and the explicitly selected features/addons are applied on top.
 */
export async function createPlan(
  input: CreatePlanInput,
): Promise<PlanCrudActionState> {
  const activeLocale = localeFromInput(input.locale);
  const t = (key: PlansKey) => translate(activeLocale, key);

  const schema = z.object({
    creationMode: z.enum(["scratch", "clone"]),
    sourcePlanId: z.string().uuid().or(z.literal("")),
    name: z.string().trim().min(2).max(140),
    code: z.string().trim().min(2).max(80).regex(PLAN_CODE_PATTERN),
    description: z.string().trim().max(1_000),
    status: z.enum(["draft", "active"]),
    isPublic: z.boolean(),
    sortOrder: z.number().int().min(0).max(1_000_000),
    versionTitle: z.string().trim().max(120),
    changeNotes: z.string().trim().max(500),
    effectiveFrom: z.string().trim(),
    priceType: z.enum(["recurring", "one_time"]),
    amountMajor: z.string().trim().regex(/^\d+(?:\.\d{1,2})?$/),
    currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/),
    billingInterval: z.enum(["day", "week", "month", "year"]),
    billingIntervalCount: z.number().int().min(1).max(365),
    trialDays: z.number().int().min(0).max(3650),
    creditWindows: z
      .array(
        z.object({
          id: z.string().min(1),
          period: z.enum(["hour", "day", "week", "month", "year", "total"]),
          periodCount: z.number().int().min(1),
          creditAmount: z.number().int().min(0),
        }),
      )
      .min(1),
    allowedUploadMimeTypes: z
      .array(z.string().trim().min(1).max(100))
      .max(20),
    rolloverEnabled: z.boolean(),
    rolloverCap: z.number().int().min(0),
    negativeBalanceAllowed: z.boolean(),
    maxNegativeBalance: z.number().int().min(0),
    featureIds: z.array(z.string().uuid()),
    addonIds: z.array(z.string().uuid()),
    locale: z.enum(["fa", "en"]),
  }).superRefine((value, context) => {
    if (value.creationMode === "clone" && !value.sourcePlanId) {
      context.addIssue({
        code: "custom",
        path: ["sourcePlanId"],
        message: t("errors.sourceRequired"),
      });
    }

    if (Number(value.amountMajor) * 100 > Number.MAX_SAFE_INTEGER) {
      context.addIssue({
        code: "custom",
        path: ["amountMajor"],
        message: t("errors.amountTooLarge"),
      });
    }

    if (
      value.effectiveFrom !== "" &&
      !Number.isFinite(new Date(`${value.effectiveFrom}:00.000Z`).getTime())
    ) {
      context.addIssue({
        code: "custom",
        path: ["effectiveFrom"],
        message: t("errors.dateInvalid"),
      });
    }

    if (value.status === "active" && !value.effectiveFrom) {
      context.addIssue({
        code: "custom",
        path: ["effectiveFrom"],
        message: t("errors.activeRequiresDate"),
      });
    }

    const totalCreditGrant = value.creditWindows.reduce(
      (sum, window) => sum + window.creditAmount,
      0,
    );
    if (value.rolloverEnabled && value.rolloverCap < totalCreditGrant) {
      context.addIssue({
        code: "custom",
        path: ["rolloverCap"],
        message: t("errors.rolloverCapLow"),
      });
    }

    if (value.negativeBalanceAllowed && value.maxNegativeBalance === 0) {
      context.addIssue({
        code: "custom",
        path: ["maxNegativeBalance"],
        message: t("errors.negativeLimit"),
      });
    }
  });
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return crudErrorState(activeLocale, "errors.reviewFields", {
      ...parsed.error.flatten().fieldErrors,
    });
  }

  const inputData = parsed.data;
  const [featureRows, addonRows, sourceRows] = await Promise.all([
    inputData.featureIds.length
      ? db
          .select({ id: features.id })
          .from(features)
          .where(
            and(
              inArray(features.id, inputData.featureIds),
              eq(features.isActive, true),
            ),
          )
      : Promise.resolve([]),
    inputData.addonIds.length
      ? db
          .select({ id: addons.id })
          .from(addons)
          .where(
            and(
              inArray(addons.id, inputData.addonIds),
              eq(addons.isActive, true),
            ),
          )
      : Promise.resolve([]),
    inputData.creationMode === "clone"
      ? db
          .select({ id: plans.id })
          .from(plans)
          .where(
            and(
              eq(plans.id, inputData.sourcePlanId),
              or(eq(plans.status, "draft"), eq(plans.status, "active")),
            ),
          )
          .limit(1)
      : Promise.resolve([]),
  ]);

  const selectedFeatureIds = featureRows.map((row) => row.id);
  const selectedAddonIds = addonRows.map((row) => row.id);

  if (inputData.creationMode === "clone" && sourceRows.length === 0) {
    return crudErrorState(activeLocale, "errors.sourceUnavailable", {
      sourcePlanId: [t("errors.sourceUnavailable")],
    });
  }

  const sourceVersionRows =
    inputData.creationMode === "clone"
      ? await db
          .select({ id: planVersions.id })
          .from(planVersions)
          .where(eq(planVersions.planId, inputData.sourcePlanId))
          .orderBy(desc(planVersions.versionNumber), desc(planVersions.createdAt))
          .limit(1)
      : [];
  const sourceVersionId = sourceVersionRows[0]?.id ?? null;

  if (inputData.creationMode === "clone" && !sourceVersionId) {
    return crudErrorState(activeLocale, "errors.noVersionToClone", {
      sourcePlanId: [t("errors.noVersionToClone")],
    });
  }

  const planId = crypto.randomUUID();
  const planVersionId = crypto.randomUUID();
  const planPriceId = crypto.randomUUID();
  const creditPolicyId = crypto.randomUUID();
  const versionStatus = inputData.status === "active" ? "published" : "draft";
  const effectiveFrom = inputData.effectiveFrom
    ? new Date(`${inputData.effectiveFrom}:00.000Z`).toISOString()
    : null;
  const amount = toMinorUnits(inputData.amountMajor);
  const creditLegacy = legacyCreditFields(inputData.creditWindows);

  const queries = [
    sqlClient`
      INSERT INTO plans (
        id, code, name, description, status, is_public, sort_order, metadata
      ) VALUES (
        ${planId},
        ${inputData.code},
        ${inputData.name},
        ${inputData.description || null},
        ${inputData.status},
        ${inputData.isPublic},
        ${inputData.sortOrder},
        ${JSON.stringify({ createdVia: "admin-plan-builder" })}::jsonb
      )
    `,
    sqlClient`
      INSERT INTO plan_versions (
        id, plan_id, version_number, status, title, effective_from,
        change_notes, metadata
      ) VALUES (
        ${planVersionId},
        ${planId},
        1,
        ${versionStatus},
        ${inputData.versionTitle || null},
        ${effectiveFrom},
        ${inputData.changeNotes || null},
        ${JSON.stringify({
          creationMode: inputData.creationMode,
          sourcePlanId:
            inputData.creationMode === "clone" ? inputData.sourcePlanId : null,
          allowedUploadMimeTypes: inputData.allowedUploadMimeTypes,
        })}::jsonb
      )
    `,
    sqlClient`
      INSERT INTO plan_prices (
        id, plan_version_id, price_type, currency, amount,
        billing_interval, billing_interval_count, trial_days, is_default, is_active
      ) VALUES (
        ${planPriceId},
        ${planVersionId},
        ${inputData.priceType},
        ${inputData.currency},
        ${amount},
        ${inputData.priceType === "recurring" ? inputData.billingInterval : null},
        ${inputData.priceType === "recurring" ? inputData.billingIntervalCount : null},
        ${inputData.trialDays > 0 ? inputData.trialDays : null},
        true,
        true
      )
    `,
    sqlClient`
      INSERT INTO plan_credit_policies (
        id, plan_version_id, monthly_credit_grant, rollover_enabled,
        rollover_cap, reset_policy, negative_balance_allowed,
        max_negative_balance, metadata
      ) VALUES (
        ${creditPolicyId},
        ${planVersionId},
        ${creditLegacy.monthlyCreditGrant},
        ${inputData.rolloverEnabled},
        ${inputData.rolloverEnabled ? inputData.rolloverCap : null},
        ${creditLegacy.resetPolicy},
        ${inputData.negativeBalanceAllowed},
        ${inputData.negativeBalanceAllowed ? inputData.maxNegativeBalance : null},
        ${JSON.stringify({ creditWindows: inputData.creditWindows })}::jsonb
      )
    `,
    ...(sourceVersionId
      ? [
          sqlClient`
            INSERT INTO plan_features (
              plan_version_id, feature_id, is_included, config
            )
            SELECT
              ${planVersionId}, feature_id, is_included, config
            FROM plan_features
            WHERE plan_version_id = ${sourceVersionId}
            ON CONFLICT (plan_version_id, feature_id) DO NOTHING
          `,
          sqlClient`
            INSERT INTO plan_limits (
              plan_version_id, feature_id, limit_value, period,
              behavior, overage_unit_price, metadata
            )
            SELECT
              ${planVersionId}, feature_id, limit_value, period,
              behavior, overage_unit_price, metadata
            FROM plan_limits
            WHERE plan_version_id = ${sourceVersionId}
          `,
          sqlClient`
            INSERT INTO feature_pricing_rules (
              plan_version_id, feature_id, metric, pricing_model, currency,
              unit_price, tiers, credit_cost_per_unit, minimum_charge, is_active, metadata
            )
            SELECT
              ${planVersionId}, feature_id, metric, pricing_model, currency,
              unit_price, tiers, credit_cost_per_unit, minimum_charge, is_active, metadata
            FROM feature_pricing_rules
            WHERE plan_version_id = ${sourceVersionId}
          `,
          sqlClient`
            INSERT INTO plan_addons (
              plan_id, addon_id, is_default, is_required
            )
            SELECT
              ${planId}, addon_id, is_default, is_required
            FROM plan_addons
            WHERE plan_id = ${inputData.sourcePlanId}
            ON CONFLICT (plan_id, addon_id) DO NOTHING
          `,
        ]
      : []),
    ...selectedFeatureIds.map(
      (featureId) => sqlClient`
        INSERT INTO plan_features (
          id, plan_version_id, feature_id, is_included, config
        ) VALUES (
          ${crypto.randomUUID()},
          ${planVersionId},
          ${featureId},
          true,
          ${JSON.stringify({})}::jsonb
        )
        ON CONFLICT (plan_version_id, feature_id) DO NOTHING
      `,
    ),
    ...selectedAddonIds.map(
      (addonId) => sqlClient`
        INSERT INTO plan_addons (
          id, plan_id, addon_id, is_default, is_required
        ) VALUES (
          ${crypto.randomUUID()},
          ${planId},
          ${addonId},
          false,
          false
        )
        ON CONFLICT (plan_id, addon_id) DO NOTHING
      `,
    ),
  ];

  try {
    await sqlClient.transaction(queries);
  } catch (error) {
    return {
      status: "error",
      message: planConstraintMessage(error, activeLocale),
      fieldErrors: {},
    };
  }

  revalidatePath("/lab");
  return {
    status: "success",
    message: translate(activeLocale, "actions.planCreated"),
    fieldErrors: {},
    planId,
  };
}

/**
 * One-click clone of an existing plan. The latest version's feature policies,
 * pricing rules, add-ons, base price, credit windows and upload extensions are
 * copied into a brand-new draft plan (new code + “copy” name).
 */
export async function clonePlan(
  planId: string,
  locale: "fa" | "en",
): Promise<PlanCrudActionState> {
  const activeLocale = localeFromInput(locale);
  const t = (key: PlansKey) => translate(activeLocale, key);

  const parsedId = z.string().uuid().safeParse(planId);
  if (!parsedId.success) {
    return crudErrorState(activeLocale, "errors.reviewFields");
  }

  const [planRows, existingCodes] = await Promise.all([
    db
      .select({
        id: plans.id,
        code: plans.code,
        name: plans.name,
        description: plans.description,
        sortOrder: plans.sortOrder,
      })
      .from(plans)
      .where(eq(plans.id, parsedId.data))
      .limit(1),
    db.select({ code: plans.code }).from(plans),
  ]);
  const source = planRows[0];
  if (!source) {
    return crudErrorState(activeLocale, "errors.planNotFound");
  }

  const sourceVersionRows = await db
    .select({
      id: planVersions.id,
      title: planVersions.title,
      changeNotes: planVersions.changeNotes,
      metadata: planVersions.metadata,
    })
    .from(planVersions)
    .where(eq(planVersions.planId, source.id))
    .orderBy(desc(planVersions.versionNumber), desc(planVersions.createdAt))
    .limit(1);
  const sourceVersion = sourceVersionRows[0];
  if (!sourceVersion) {
    return crudErrorState(activeLocale, "errors.noVersionToClone");
  }

  const [priceRows, creditRows] = await Promise.all([
    db
      .select({
        priceType: planPrices.priceType,
        currency: planPrices.currency,
        amount: planPrices.amount,
        billingInterval: planPrices.billingInterval,
        billingIntervalCount: planPrices.billingIntervalCount,
        trialDays: planPrices.trialDays,
      })
      .from(planPrices)
      .where(
        and(
          eq(planPrices.planVersionId, sourceVersion.id),
          eq(planPrices.isDefault, true),
          eq(planPrices.isActive, true),
        ),
      )
      .limit(1),
    db
      .select({
        monthlyCreditGrant: planCreditPolicies.monthlyCreditGrant,
        rolloverEnabled: planCreditPolicies.rolloverEnabled,
        rolloverCap: planCreditPolicies.rolloverCap,
        negativeBalanceAllowed: planCreditPolicies.negativeBalanceAllowed,
        maxNegativeBalance: planCreditPolicies.maxNegativeBalance,
        metadata: planCreditPolicies.metadata,
      })
      .from(planCreditPolicies)
      .where(eq(planCreditPolicies.planVersionId, sourceVersion.id))
      .limit(1),
  ]);
  const price = priceRows[0];
  const credit = creditRows[0];

  const sourceMetadata =
    sourceVersion.metadata && typeof sourceVersion.metadata === "object"
      ? (sourceVersion.metadata as { allowedUploadMimeTypes?: unknown })
      : {};
  const allowedUploadMimeTypes = Array.isArray(
    sourceMetadata.allowedUploadMimeTypes,
  )
    ? sourceMetadata.allowedUploadMimeTypes.filter(
        (entry): entry is string => typeof entry === "string",
      )
    : [];
  const creditWindows = parseCreditWindows(credit?.metadata);

  const code = nextCloneCode(
    existingCodes.map((row) => row.code),
    `${source.code}-copy`,
  );
  const name = `${source.name} ${t("actions.cloneSuffix")}`;

  return createPlan({
    creationMode: "clone",
    sourcePlanId: source.id,
    name,
    code,
    description: source.description ?? "",
    status: "draft",
    isPublic: false,
    sortOrder: source.sortOrder,
    versionTitle: sourceVersion.title ?? "",
    changeNotes: sourceVersion.changeNotes ?? "",
    effectiveFrom: "",
    priceType: price?.priceType ?? "recurring",
    amountMajor: price ? (price.amount / 100).toFixed(2) : "0",
    currency: price?.currency ?? "USD",
    billingInterval: price?.billingInterval ?? "month",
    billingIntervalCount: price?.billingIntervalCount ?? 1,
    trialDays: price?.trialDays ?? 0,
    creditWindows:
      creditWindows.length > 0
        ? creditWindows
        : [
            {
              id: crypto.randomUUID(),
              period: "total",
              periodCount: 1,
              creditAmount: Number(credit?.monthlyCreditGrant ?? 0),
            },
          ],
    rolloverEnabled: credit?.rolloverEnabled ?? false,
    rolloverCap: credit?.rolloverCap ?? 0,
    negativeBalanceAllowed: credit?.negativeBalanceAllowed ?? false,
    maxNegativeBalance: credit?.maxNegativeBalance ?? 0,
    featureIds: [],
    addonIds: [],
    allowedUploadMimeTypes,
    locale: activeLocale,
  });
}

/**
 * Update plan metadata (name, description, visibility, status). The code is
 * stable after creation; policy edits still branch into new versions.
 */
export async function updatePlan(
  input: UpdatePlanInput,
): Promise<PlanCrudActionState> {
  const activeLocale = localeFromInput(input.locale);

  const schema = z.object({
    planId: z.string().uuid(),
    name: z.string().trim().min(2).max(140),
    description: z.string().trim().max(1_000),
    isPublic: z.boolean(),
    status: z.enum(["draft", "active", "archived"]),
    locale: z.enum(["fa", "en"]),
  });
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return crudErrorState(activeLocale, "errors.reviewFields", {
      ...parsed.error.flatten().fieldErrors,
    });
  }

  const { planId, name, description, isPublic, status } = parsed.data;
  const planRows = await db
    .select({ id: plans.id })
    .from(plans)
    .where(eq(plans.id, planId))
    .limit(1);
  if (planRows.length === 0) {
    return crudErrorState(activeLocale, "errors.planNotFound");
  }

  try {
    await sqlClient`
      UPDATE plans
      SET
        name = ${name},
        description = ${description || null},
        is_public = ${isPublic},
        status = ${status},
        updated_at = NOW()
      WHERE id = ${planId}
    `;
  } catch (error) {
    return crudErrorState(activeLocale, "errors.commitFailed");
  }

  revalidatePath("/lab");
  return {
    status: "success",
    message: translate(activeLocale, "actions.planUpdated"),
    fieldErrors: {},
    planId,
  };
}

/**
 * Soft-archive a plan. Physical rows are never deleted.
 */
export async function archivePlan(
  planId: string,
  locale: "fa" | "en",
): Promise<PlanCrudActionState> {
  const activeLocale = localeFromInput(locale);
  const parsed = z.string().uuid().safeParse(planId);
  if (!parsed.success) {
    return crudErrorState(activeLocale, "errors.reviewFields");
  }

  const planRows = await db
    .select({ id: plans.id })
    .from(plans)
    .where(eq(plans.id, parsed.data))
    .limit(1);
  if (planRows.length === 0) {
    return crudErrorState(activeLocale, "errors.planNotFound");
  }

  try {
    await sqlClient`
      UPDATE plans
      SET status = 'archived', updated_at = NOW()
      WHERE id = ${parsed.data}
    `;
  } catch (error) {
    return crudErrorState(activeLocale, "errors.commitFailed");
  }

  revalidatePath("/lab");
  return {
    status: "success",
    message: translate(activeLocale, "actions.planArchived"),
    fieldErrors: {},
    planId: parsed.data,
  };
}
