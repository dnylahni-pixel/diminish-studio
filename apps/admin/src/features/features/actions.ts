"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, sqlClient } from "@/db";
import { featureDependencies, features } from "@/db/schema";
import {
  defaultLocale,
  isLocale,
  localePrefix,
  type Locale,
} from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import type { TFunction } from "@/i18n/translate";
import type { FeatureActionState } from "./types";

function localeFromForm(formData: FormData): Locale {
  const value = formData.get("locale");
  const candidate = typeof value === "string" ? value : undefined;
  return isLocale(candidate) ? candidate : defaultLocale;
}

function buildValidationSchemas(t: TFunction) {
  const codeSchema = z
    .string()
    .trim()
    .min(2, t("features.actions.codeTooShort"))
    .max(80)
    .regex(
      /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/,
      t("features.actions.codeInvalid"),
    );

  const optionalJsonSchema = z
    .string()
    .trim()
    .max(20_000, t("features.actions.jsonTooLarge"))
    .refine((value) => {
      if (!value) return true;
      try {
        const parsed = JSON.parse(value);
        return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed);
      } catch {
        return false;
      }
    }, t("features.actions.jsonObject"));

  const featureSchema = z.object({
    name: z.string().trim().min(2).max(140),
    code: codeSchema,
    description: z.string().trim().max(1_000),
    kind: z.enum(["boolean", "metered", "quota", "package"]),
    unitName: z.string().trim().max(80),
    isActive: z.boolean(),
    defaultAccess: z.enum(["allow", "deny"]),
    metadataJson: optionalJsonSchema,
    dependencyIds: z.array(z.string().uuid()).max(100),
  });

  const updateFeatureSchema = featureSchema.omit({ dependencyIds: true });

  const dependencySchema = z.object({
    dependsOnFeatureId: z.string().uuid(),
    dependencyMode: z.enum(["hard", "soft"]),
    conditionJson: optionalJsonSchema,
  });

  const planPolicySchema = z
    .object({
      planVersionId: z.string().uuid(),
      accessMode: z.enum(["inherit", "allow", "deny"]),
      featureConfigJson: optionalJsonSchema,
      limitMode: z.enum(["unlimited", "custom"]),
      limitValue: z.string().trim(),
      period: z.enum(["none", "day", "week", "month"]),
      behavior: z.enum(["block", "allow_overage"]),
      overageUnitPrice: z.string().trim(),
      limitMetadataJson: optionalJsonSchema,
      pricingMode: z.enum(["free", "custom"]),
      metric: z.enum(["unit", "minute", "megabyte", "request", "seat"]),
      pricingModel: z.enum(["flat", "tiered", "volume"]),
      currency: z.string().trim().toUpperCase(),
      unitPrice: z.string().trim(),
      creditCostPerUnit: z.string().trim(),
      minimumCharge: z.string().trim(),
      tiersJson: z
        .string()
        .trim()
        .max(20_000)
        .refine((value) => {
          if (!value) return true;
          try {
            return Array.isArray(JSON.parse(value));
          } catch {
            return false;
          }
        }, t("features.actions.tiersArray")),
      pricingMetadataJson: optionalJsonSchema,
    })
    .superRefine((value, context) => {
      if (value.limitMode === "custom") {
        if (!/^\d+$/.test(value.limitValue)) {
          context.addIssue({
            code: "custom",
            path: ["limitValue"],
            message: t("features.actions.limitWholeNumber"),
          });
        }
        if (
          value.behavior === "allow_overage" &&
          value.overageUnitPrice &&
          !/^\d+$/.test(value.overageUnitPrice)
        ) {
          context.addIssue({
            code: "custom",
            path: ["overageUnitPrice"],
            message: t("features.actions.overageWholeNumber"),
          });
        }
      }

      if (value.pricingMode === "custom") {
        if (value.currency && !/^[A-Z]{3}$/.test(value.currency)) {
          context.addIssue({
            code: "custom",
            path: ["currency"],
            message: t("features.actions.currencyCode"),
          });
        }
        for (const field of [
          "unitPrice",
          "creditCostPerUnit",
          "minimumCharge",
        ] as const) {
          if (value[field] && !/^\d+$/.test(value[field])) {
            context.addIssue({
              code: "custom",
              path: [field],
              message: t("features.actions.nonNegativeWholeNumber"),
            });
          }
        }
      }
    });

  return { featureSchema, updateFeatureSchema, dependencySchema, planPolicySchema };
}

function formBoolean(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function formStrings(formData: FormData, name: string) {
  return formData
    .getAll(name)
    .filter((value): value is string => typeof value === "string");
}

function parseJsonObject(value: string) {
  if (!value) return {};
  return JSON.parse(value) as Record<string, unknown>;
}

function nullableInteger(value: string) {
  return value ? Number(value) : null;
}

function featureConstraintMessage(error: unknown, t: TFunction) {
  const details =
    error instanceof Error
      ? `${error.message} ${String((error as { cause?: unknown }).cause ?? "")}`
      : String(error);

  if (details.includes("features_code_unique") || details.includes("duplicate key")) {
    return t("features.actions.codeInUse");
  }

  return t("features.actions.commitFailed");
}

function revalidateFeaturePaths(featureId?: string) {
  revalidatePath("/features");
  revalidatePath("/plans");
  if (featureId) revalidatePath(`/features/${featureId}`);
}

async function createsDependencyCycle(
  featureId: string,
  dependsOnFeatureId: string,
) {
  const rows = await db
    .select({
      featureId: featureDependencies.featureId,
      dependsOnFeatureId: featureDependencies.dependsOnFeatureId,
    })
    .from(featureDependencies);
  const adjacency = new Map<string, string[]>();

  for (const row of rows) {
    const current = adjacency.get(row.featureId) ?? [];
    current.push(row.dependsOnFeatureId);
    adjacency.set(row.featureId, current);
  }

  const current = adjacency.get(featureId) ?? [];
  current.push(dependsOnFeatureId);
  adjacency.set(featureId, current);
  const visited = new Set<string>();

  function reachesCurrent(nodeId: string): boolean {
    if (nodeId === featureId) return true;
    if (visited.has(nodeId)) return false;
    visited.add(nodeId);
    return (adjacency.get(nodeId) ?? []).some(reachesCurrent);
  }

  return reachesCurrent(dependsOnFeatureId);
}

export async function createFeature(
  _previousState: FeatureActionState,
  formData: FormData,
): Promise<FeatureActionState> {
  const i18n = await getI18n(localeFromForm(formData));
  const { featureSchema } = buildValidationSchemas(i18n.t);
  const parsed = featureSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    description: formData.get("description") ?? "",
    kind: formData.get("kind"),
    unitName: formData.get("unitName") ?? "",
    isActive: formBoolean(formData, "isActive"),
    defaultAccess: formData.get("defaultAccess"),
    metadataJson: formData.get("metadataJson") ?? "",
    dependencyIds: formStrings(formData, "dependencyIds"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: i18n.t("features.actions.createReview"),
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const input = parsed.data;
  const featureId = crypto.randomUUID();
  const metadata = {
    ...parseJsonObject(input.metadataJson),
    defaultAccess: input.defaultAccess,
    policyFallbacks: {
      access: input.defaultAccess,
      limit: "unlimited",
      pricing: "free",
    },
  };
  const validDependencies =
    input.dependencyIds.length > 0
      ? await db
          .select({ id: features.id })
          .from(features)
          .where(eq(features.isActive, true))
      : [];
  const validDependencyIds = new Set(validDependencies.map((row) => row.id));
  const dependencyIds = input.dependencyIds.filter((id) =>
    validDependencyIds.has(id),
  );
  const queries = [
    sqlClient`
      INSERT INTO features (
        id, code, name, description, kind, unit_name, is_active, metadata
      ) VALUES (
        ${featureId},
        ${input.code},
        ${input.name},
        ${input.description || null},
        ${input.kind},
        ${input.unitName || null},
        ${input.isActive},
        ${JSON.stringify(metadata)}::jsonb
      )
    `,
    ...dependencyIds.map(
      (dependsOnFeatureId) => sqlClient`
        INSERT INTO feature_dependencies (
          id, feature_id, depends_on_feature_id, is_hard_dependency, condition_config
        ) VALUES (
          ${crypto.randomUUID()},
          ${featureId},
          ${dependsOnFeatureId},
          true,
          ${JSON.stringify({})}::jsonb
        )
      `,
    ),
  ];

  try {
    await sqlClient.transaction(queries);
  } catch (error) {
    return {
      status: "error",
      message: featureConstraintMessage(error, i18n.t),
      fieldErrors: {},
    };
  }

  revalidateFeaturePaths(featureId);
  redirect(localePrefix(i18n.locale, `/features/${featureId}`));
}

export async function updateFeature(
  featureId: string,
  _previousState: FeatureActionState,
  formData: FormData,
): Promise<FeatureActionState> {
  const i18n = await getI18n(localeFromForm(formData));
  const { updateFeatureSchema } = buildValidationSchemas(i18n.t);
  const parsed = updateFeatureSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    description: formData.get("description") ?? "",
    kind: formData.get("kind"),
    unitName: formData.get("unitName") ?? "",
    isActive: formBoolean(formData, "isActive"),
    defaultAccess: formData.get("defaultAccess"),
    metadataJson: formData.get("metadataJson") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: i18n.t("features.actions.updateReview"),
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const existingRows = await db
    .select({ id: features.id })
    .from(features)
    .where(eq(features.id, featureId))
    .limit(1);
  if (existingRows.length === 0) {
    return {
      status: "error",
      message: i18n.t("features.actions.featureNotFound"),
      fieldErrors: {},
    };
  }

  const input = parsed.data;
  const metadata = {
    ...parseJsonObject(input.metadataJson),
    defaultAccess: input.defaultAccess,
    policyFallbacks: {
      access: input.defaultAccess,
      limit: "unlimited",
      pricing: "free",
    },
  };

  try {
    await sqlClient`
      UPDATE features
      SET
        code = ${input.code},
        name = ${input.name},
        description = ${input.description || null},
        kind = ${input.kind},
        unit_name = ${input.unitName || null},
        is_active = ${input.isActive},
        metadata = ${JSON.stringify(metadata)}::jsonb,
        updated_at = NOW()
      WHERE id = ${featureId}
    `;
  } catch (error) {
    return {
      status: "error",
      message: featureConstraintMessage(error, i18n.t),
      fieldErrors: {},
    };
  }

  revalidateFeaturePaths(featureId);
  return {
    status: "success",
    message: i18n.t("features.actions.saved"),
    fieldErrors: {},
  };
}

export async function addFeatureDependency(
  featureId: string,
  _previousState: FeatureActionState,
  formData: FormData,
): Promise<FeatureActionState> {
  const i18n = await getI18n(localeFromForm(formData));
  const { dependencySchema } = buildValidationSchemas(i18n.t);
  const parsed = dependencySchema.safeParse({
    dependsOnFeatureId: formData.get("dependsOnFeatureId"),
    dependencyMode: formData.get("dependencyMode"),
    conditionJson: formData.get("conditionJson") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: i18n.t("features.actions.dependencyReview"),
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const input = parsed.data;
  if (featureId === input.dependsOnFeatureId) {
    return {
      status: "error",
      message: i18n.t("features.actions.selfDependency"),
      fieldErrors: {},
    };
  }

  const targetRows = await db
    .select({ id: features.id })
    .from(features)
    .where(eq(features.id, input.dependsOnFeatureId))
    .limit(1);
  if (targetRows.length === 0) {
    return {
      status: "error",
      message: i18n.t("features.actions.dependencyMissing"),
      fieldErrors: {},
    };
  }

  if (await createsDependencyCycle(featureId, input.dependsOnFeatureId)) {
    return {
      status: "error",
      message: i18n.t("features.actions.dependencyCycle"),
      fieldErrors: {},
    };
  }

  try {
    await sqlClient`
      INSERT INTO feature_dependencies (
        id, feature_id, depends_on_feature_id, is_hard_dependency, condition_config
      ) VALUES (
        ${crypto.randomUUID()},
        ${featureId},
        ${input.dependsOnFeatureId},
        ${input.dependencyMode === "hard"},
        ${JSON.stringify(parseJsonObject(input.conditionJson))}::jsonb
      )
      ON CONFLICT (feature_id, depends_on_feature_id)
      DO UPDATE SET
        is_hard_dependency = EXCLUDED.is_hard_dependency,
        condition_config = EXCLUDED.condition_config
    `;
  } catch (error) {
    return {
      status: "error",
      message: featureConstraintMessage(error, i18n.t),
      fieldErrors: {},
    };
  }

  revalidateFeaturePaths(featureId);
  return {
    status: "success",
    message: i18n.t("features.actions.dependencySaved"),
    fieldErrors: {},
  };
}

export async function removeFeatureDependency(
  featureId: string,
  dependencyId: string,
) {
  const parsed = z.string().uuid().safeParse(dependencyId);
  if (!parsed.success) return;

  await db
    .delete(featureDependencies)
    .where(
      and(
        eq(featureDependencies.id, parsed.data),
        eq(featureDependencies.featureId, featureId),
      ),
    );
  revalidateFeaturePaths(featureId);
}

export async function saveFeaturePlanPolicy(
  featureId: string,
  _previousState: FeatureActionState,
  formData: FormData,
): Promise<FeatureActionState> {
  const i18n = await getI18n(localeFromForm(formData));
  const { planPolicySchema } = buildValidationSchemas(i18n.t);
  const parsed = planPolicySchema.safeParse({
    planVersionId: formData.get("planVersionId"),
    accessMode: formData.get("accessMode"),
    featureConfigJson: formData.get("featureConfigJson") ?? "",
    limitMode: formData.get("limitMode"),
    limitValue: formData.get("limitValue") ?? "",
    period: formData.get("period"),
    behavior: formData.get("behavior"),
    overageUnitPrice: formData.get("overageUnitPrice") ?? "",
    limitMetadataJson: formData.get("limitMetadataJson") ?? "",
    pricingMode: formData.get("pricingMode"),
    metric: formData.get("metric"),
    pricingModel: formData.get("pricingModel"),
    currency: formData.get("currency") ?? "",
    unitPrice: formData.get("unitPrice") ?? "",
    creditCostPerUnit: formData.get("creditCostPerUnit") ?? "",
    minimumCharge: formData.get("minimumCharge") ?? "",
    tiersJson: formData.get("tiersJson") ?? "",
    pricingMetadataJson: formData.get("pricingMetadataJson") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: i18n.t("features.actions.policyReview"),
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const input = parsed.data;
  const queries = [
    sqlClient`
      DELETE FROM plan_features
      WHERE plan_version_id = ${input.planVersionId}
        AND feature_id = ${featureId}
    `,
    sqlClient`
      DELETE FROM plan_limits
      WHERE plan_version_id = ${input.planVersionId}
        AND feature_id = ${featureId}
    `,
    sqlClient`
      DELETE FROM feature_pricing_rules
      WHERE plan_version_id = ${input.planVersionId}
        AND feature_id = ${featureId}
    `,
    ...(input.accessMode !== "inherit"
      ? [
          sqlClient`
            INSERT INTO plan_features (
              id, plan_version_id, feature_id, is_included, config
            ) VALUES (
              ${crypto.randomUUID()},
              ${input.planVersionId},
              ${featureId},
              ${input.accessMode === "allow"},
              ${JSON.stringify(parseJsonObject(input.featureConfigJson))}::jsonb
            )
          `,
        ]
      : []),
    ...(input.limitMode === "custom"
      ? [
          sqlClient`
            INSERT INTO plan_limits (
              id, plan_version_id, feature_id, limit_value, period,
              behavior, overage_unit_price, metadata
            ) VALUES (
              ${crypto.randomUUID()},
              ${input.planVersionId},
              ${featureId},
              ${Number(input.limitValue)},
              ${input.period},
              ${input.behavior},
              ${input.behavior === "allow_overage"
                ? nullableInteger(input.overageUnitPrice)
                : null},
              ${JSON.stringify(parseJsonObject(input.limitMetadataJson))}::jsonb
            )
          `,
        ]
      : []),
    ...(input.pricingMode === "custom"
      ? [
          sqlClient`
            INSERT INTO feature_pricing_rules (
              id, plan_version_id, feature_id, metric, pricing_model,
              currency, unit_price, tiers, credit_cost_per_unit,
              minimum_charge, is_active, metadata
            ) VALUES (
              ${crypto.randomUUID()},
              ${input.planVersionId},
              ${featureId},
              ${input.metric},
              ${input.pricingModel},
              ${input.currency || null},
              ${nullableInteger(input.unitPrice)},
              ${JSON.stringify(input.tiersJson ? JSON.parse(input.tiersJson) : [])}::jsonb,
              ${nullableInteger(input.creditCostPerUnit)},
              ${nullableInteger(input.minimumCharge)},
              true,
              ${JSON.stringify(parseJsonObject(input.pricingMetadataJson))}::jsonb
            )
          `,
        ]
      : []),
  ];

  try {
    await sqlClient.transaction(queries);
  } catch (error) {
    return {
      status: "error",
      message: featureConstraintMessage(error, i18n.t),
      fieldErrors: {},
    };
  }

  revalidateFeaturePaths(featureId);
  revalidatePath(`/plans`);
  return {
    status: "success",
    message: i18n.t("features.actions.policySaved"),
    fieldErrors: {},
  };
}
