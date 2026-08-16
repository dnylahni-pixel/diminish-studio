"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { db, sqlClient } from "@/db";
import {
  addons,
  features,
  plans,
  planVersions,
} from "@/db/schema";
import { isLocale } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import type { TFunction } from "@/i18n/translate";
import type { CreatePlanActionState } from "./types";

function buildPlanSchema(t: TFunction) {
  const optionalDateTime = z
    .string()
    .trim()
    .refine(
      (value) => value === "" || Number.isFinite(new Date(value).getTime()),
      t("plans.action.errors.invalidEffectiveDate"),
    );

  return z
    .object({
      creationMode: z.enum(["scratch", "clone"]),
      sourcePlanId: z.string().uuid().or(z.literal("")),
      name: z
        .string()
        .trim()
        .min(2, t("plans.action.errors.nameMin"))
        .max(120),
      code: z
        .string()
        .trim()
        .min(2, t("plans.action.errors.codeMin"))
        .max(64)
        .regex(
          /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/,
          t("plans.action.errors.codeRegex"),
        ),
      description: z.string().trim().max(500),
      status: z.enum(["draft", "active"]),
      visibility: z.enum(["private", "public"]),
      sortOrder: z.coerce.number().int().min(0).max(1_000_000),
      versionTitle: z.string().trim().max(120),
      changeNotes: z.string().trim().max(500),
      effectiveFrom: optionalDateTime,
      priceType: z.enum(["recurring", "one_time"]),
      amountMajor: z
        .string()
        .trim()
        .regex(/^\d+(?:\.\d{1,2})?$/, t("plans.action.errors.amountRegex"))
        .refine(
          (value) => Number(value) * 100 <= Number.MAX_SAFE_INTEGER,
          t("plans.action.errors.amountTooLarge"),
        ),
      currency: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z]{3}$/, t("plans.action.errors.currencyRegex")),
      billingInterval: z.enum(["day", "week", "month", "year"]),
      billingIntervalCount: z.coerce.number().int().min(1).max(365),
      trialDays: z.coerce.number().int().min(0).max(3650),
      monthlyCreditGrant: z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
      resetPolicy: z.enum(["none", "daily", "weekly", "monthly"]),
      rolloverEnabled: z.boolean(),
      rolloverCap: z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
      negativeBalanceAllowed: z.boolean(),
      maxNegativeBalance: z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
      featureIds: z.array(z.string().uuid()),
      addonIds: z.array(z.string().uuid()),
    })
    .superRefine((value, context) => {
      if (value.creationMode === "clone" && !value.sourcePlanId) {
        context.addIssue({
          code: "custom",
          path: ["sourcePlanId"],
          message: t("plans.action.errors.sourceRequired"),
        });
      }

      if (value.status === "active" && !value.effectiveFrom) {
        context.addIssue({
          code: "custom",
          path: ["effectiveFrom"],
          message: t("plans.action.errors.activeRequiresDate"),
        });
      }

      if (value.rolloverEnabled && value.rolloverCap < value.monthlyCreditGrant) {
        context.addIssue({
          code: "custom",
          path: ["rolloverCap"],
          message: t("plans.action.errors.rolloverCapLow"),
        });
      }

      if (value.negativeBalanceAllowed && value.maxNegativeBalance === 0) {
        context.addIssue({
          code: "custom",
          path: ["maxNegativeBalance"],
          message: t("plans.action.errors.negativeLimit"),
        });
      }
    });
}

function formBoolean(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function formStrings(formData: FormData, name: string) {
  return formData
    .getAll(name)
    .filter((value): value is string => typeof value === "string");
}

function toMinorUnits(value: string) {
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

function constraintMessage(error: unknown, t: TFunction) {
  const details =
    error instanceof Error
      ? `${error.message} ${String((error as { cause?: unknown }).cause ?? "")}`
      : String(error);

  if (
    details.includes("plans_code_unique") ||
    details.includes("duplicate key") ||
    details.includes("uq_plan_version")
  ) {
    return t("plans.action.errors.duplicateCode");
  }

  return t("plans.action.errors.creationFailed");
}

export async function createPlan(
  _previousState: CreatePlanActionState,
  formData: FormData,
): Promise<CreatePlanActionState> {
  const locale = (await cookies()).get("locale")?.value;
  const lang = isLocale(locale) ? locale : "en";
  const i18n = await getI18n(lang);
  const t = i18n.t;
  const planSchema = buildPlanSchema(t);

  const parsed = planSchema.safeParse({
    creationMode: formData.get("creationMode"),
    sourcePlanId: formData.get("sourcePlanId") ?? "",
    name: formData.get("name"),
    code: formData.get("code"),
    description: formData.get("description") ?? "",
    status: formData.get("status"),
    visibility: formData.get("visibility"),
    sortOrder: formData.get("sortOrder"),
    versionTitle: formData.get("versionTitle") ?? "",
    changeNotes: formData.get("changeNotes") ?? "",
    effectiveFrom: formData.get("effectiveFrom") ?? "",
    priceType: formData.get("priceType"),
    amountMajor: formData.get("amountMajor"),
    currency: formData.get("currency"),
    billingInterval: formData.get("billingInterval"),
    billingIntervalCount: formData.get("billingIntervalCount"),
    trialDays: formData.get("trialDays"),
    monthlyCreditGrant: formData.get("monthlyCreditGrant"),
    resetPolicy: formData.get("resetPolicy"),
    rolloverEnabled: formBoolean(formData, "rolloverEnabled"),
    rolloverCap: formData.get("rolloverCap") || "0",
    negativeBalanceAllowed: formBoolean(formData, "negativeBalanceAllowed"),
    maxNegativeBalance: formData.get("maxNegativeBalance") || "0",
    featureIds: formStrings(formData, "featureIds"),
    addonIds: formStrings(formData, "addonIds"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: t("plans.action.errors.reviewFields"),
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const input = parsed.data;
  const [featureRows, addonRows, sourceRows] = await Promise.all([
    input.featureIds.length
      ? db
          .select({ id: features.id })
          .from(features)
          .where(
            and(
              inArray(features.id, input.featureIds),
              eq(features.isActive, true),
            ),
          )
      : Promise.resolve([]),
    input.addonIds.length
      ? db
          .select({ id: addons.id })
          .from(addons)
          .where(
            and(
              inArray(addons.id, input.addonIds),
              eq(addons.isActive, true),
            ),
          )
      : Promise.resolve([]),
    input.creationMode === "clone"
      ? db
          .select({ id: plans.id })
          .from(plans)
          .where(
            and(
              eq(plans.id, input.sourcePlanId),
              or(eq(plans.status, "active"), eq(plans.status, "draft")),
            ),
          )
          .limit(1)
      : Promise.resolve([]),
  ]);

  const activeFeatureIds = new Set(featureRows.map((row) => row.id));
  const activeAddonIds = new Set(addonRows.map((row) => row.id));
  const selectedFeatureIds = input.featureIds.filter((id) => activeFeatureIds.has(id));
  const selectedAddonIds = input.addonIds.filter((id) => activeAddonIds.has(id));

  if (input.creationMode === "clone" && sourceRows.length === 0) {
    return {
      status: "error",
      message: t("plans.action.errors.sourceUnavailable"),
      fieldErrors: { sourcePlanId: [t("plans.action.errors.sourceUnavailableField")] },
    };
  }

  const planId = crypto.randomUUID();
  const planVersionId = crypto.randomUUID();
  const planPriceId = crypto.randomUUID();
  const creditPolicyId = crypto.randomUUID();
  const versionStatus = input.status === "active" ? "published" : "draft";
  const effectiveFrom = input.effectiveFrom
    ? new Date(`${input.effectiveFrom}:00.000Z`).toISOString()
    : null;
  const amount = toMinorUnits(input.amountMajor);
  const sourceVersionRows =
    input.creationMode === "clone"
      ? await db
          .select({ id: planVersions.id })
          .from(planVersions)
          .where(eq(planVersions.planId, input.sourcePlanId))
          .orderBy(desc(planVersions.versionNumber), desc(planVersions.createdAt))
          .limit(1)
      : [];
  const sourceVersionId = sourceVersionRows[0]?.id ?? null;

  if (input.creationMode === "clone" && !sourceVersionId) {
    return {
      status: "error",
      message: t("plans.action.errors.noVersionToClone"),
      fieldErrors: { sourcePlanId: [t("plans.action.errors.noVersionField")] },
    };
  }

  const queries = [
    sqlClient`
      INSERT INTO plans (
        id, code, name, description, status, is_public, sort_order, metadata
      ) VALUES (
        ${planId},
        ${input.code},
        ${input.name},
        ${input.description || null},
        ${input.status},
        ${input.visibility === "public"},
        ${input.sortOrder},
        ${JSON.stringify({ createdVia: "admin-plan-builder" })}::jsonb
      )
    `,
    sqlClient`
      INSERT INTO plan_versions (
        id, plan_id, version_number, status, title, effective_from, change_notes, metadata
      ) VALUES (
        ${planVersionId},
        ${planId},
        1,
        ${versionStatus},
        ${input.versionTitle || t("plans.builder.defaults.versionTitle")},
        ${effectiveFrom},
        ${input.changeNotes || t("plans.builder.defaults.changeNotes")},
        ${JSON.stringify({
          creationMode: input.creationMode,
          sourcePlanId: input.creationMode === "clone" ? input.sourcePlanId : null,
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
        ${input.priceType},
        ${input.currency},
        ${amount},
        ${input.priceType === "recurring" ? input.billingInterval : null},
        ${input.priceType === "recurring" ? input.billingIntervalCount : null},
        ${input.trialDays > 0 ? input.trialDays : null},
        true,
        true
      )
    `,
    sqlClient`
      INSERT INTO plan_credit_policies (
        id, plan_version_id, monthly_credit_grant, rollover_enabled,
        rollover_cap, reset_policy, negative_balance_allowed, max_negative_balance
      ) VALUES (
        ${creditPolicyId},
        ${planVersionId},
        ${input.monthlyCreditGrant},
        ${input.rolloverEnabled},
        ${input.rolloverEnabled ? input.rolloverCap : null},
        ${input.resetPolicy},
        ${input.negativeBalanceAllowed},
        ${input.negativeBalanceAllowed ? input.maxNegativeBalance : null}
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
            WHERE plan_id = ${input.sourcePlanId}
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
      message: constraintMessage(error, t),
      fieldErrors: {},
    };
  }

  revalidatePath("/plans");
  revalidatePath(`/plans/${planId}`);
  redirect(`/plans/${planId}`);
}
