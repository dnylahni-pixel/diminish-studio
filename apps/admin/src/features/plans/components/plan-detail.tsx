"use client";

import type { ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeDollarSign,
  BookOpenCheck,
  Boxes,
  Coins,
  Gauge,
  Route,
  Users,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Card,
  DescriptionList,
  StatusIndicator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Timeline,
} from "@/components/ui/data-display";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { Breadcrumb } from "@/components/ui/navigation";
import { Code, Heading, NumericText, Text } from "@/components/ui/typography";
import { LocalizedLink, useI18n } from "@/i18n/client";
import type { TFunction } from "@/i18n/translate";
import type {
  FeaturePricingRuleDetail,
  PlanChangeRuleDetail,
  PlanDetailData,
  PlanFeatureDetail,
  PlanLimitDetail,
  PlanVersionDetail,
  SubscriptionStatus,
} from "../types";
import { PlanDetailTabs } from "./plan-detail-tabs";
import {
  enumLabel,
  formatDateRange,
  formatDateTime,
  formatInterval,
  formatMoney,
  formatNumber,
  getPlanStatusTone,
  getSubscriptionStatusTone,
  getVersionStatusTone,
  titleize,
} from "./plan-formatters";

function SummaryCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: ReactNode;
  helper: string;
  icon: ReactNode;
}) {
  return (
    <Card className="min-h-36">
      <div className="flex items-start justify-between gap-4">
        <div className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-neutral-100 text-neutral-500">
          {icon}
        </div>
      </div>
      <Text size="xs" tone="muted" weight="medium" className="mt-4">
        {label}
      </Text>
      <div className="mt-1">{value}</div>
      <Text size="xs" tone="subtle" className="mt-1.5">
        {helper}
      </Text>
    </Card>
  );
}

function SectionHeader({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
      <div>
        <Heading level={6}>{title}</Heading>
        <Text size="xs" tone="muted" className="mt-1">
          {description}
        </Text>
      </div>
      {badge}
    </div>
  );
}

function OverviewTab({ data }: { data: PlanDetailData }) {
  const { t } = useI18n();
  const statusOrder: SubscriptionStatus[] = [
    "active",
    "trialing",
    "past_due",
    "paused",
    "incomplete",
    "canceled",
    "expired",
  ];
  const statusTotals = new Map<SubscriptionStatus, number>();

  for (const item of data.subscriptionBreakdown) {
    statusTotals.set(item.status, (statusTotals.get(item.status) ?? 0) + item.count);
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card>
        <SectionHeader
          title={t("plans.detail.overview.catalogIdentity")}
          description={t("plans.detail.overview.catalogIdentityDescription")}
        />
        <div className="mt-6">
          <DescriptionList
            items={[
              { term: t("plans.detail.overview.planCode"), description: <Code>{data.plan.code}</Code> },
              {
                term: t("plans.detail.overview.lifecycle"),
                description: (
                  <StatusIndicator
                    tone={getPlanStatusTone(data.plan.status)}
                    label={enumLabel(t, data.plan.status)}
                  />
                ),
              },
              {
                term: t("plans.detail.overview.visibility"),
                description: data.plan.isPublic
                  ? t("plans.detail.overview.publicCatalog")
                  : t("plans.detail.overview.privateCatalog"),
              },
              {
                term: t("plans.detail.overview.catalogOrder"),
                description: formatNumber(data.plan.sortOrder),
              },
              {
                term: t("plans.detail.overview.created"),
                description: (
                  <time dateTime={data.plan.createdAt}>
                    {formatDateTime(data.plan.createdAt, t)}
                  </time>
                ),
              },
              {
                term: t("plans.detail.overview.lastUpdated"),
                description: (
                  <time dateTime={data.plan.updatedAt}>
                    {formatDateTime(data.plan.updatedAt, t)}
                  </time>
                ),
              },
            ]}
          />
        </div>
      </Card>

      <Card>
        <SectionHeader
          title={t("plans.detail.overview.subscriberLifecycle")}
          description={t("plans.detail.overview.subscriberLifecycleDescription")}
          badge={
            <Badge tone="neutral">
              {t("plans.detail.overview.subscriberTotal", {
                count: formatNumber(
                  [...statusTotals.values()].reduce((total, value) => total + value, 0),
                ),
              })}
            </Badge>
          }
        />
        <div className="mt-5">
          {statusTotals.size > 0 ? (
            <div className="divide-y divide-neutral-100">
              {statusOrder
                .filter((status) => statusTotals.has(status))
                .map((status) => (
                  <div
                    key={status}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <StatusIndicator
                      tone={getSubscriptionStatusTone(status)}
                      label={enumLabel(t, status)}
                    />
                    <NumericText size="sm">
                      {formatNumber(statusTotals.get(status) ?? 0)}
                    </NumericText>
                  </div>
                ))}
            </div>
          ) : (
            <EmptyState
              title={t("plans.detail.overview.noSubscriptionExposure")}
              description={t("plans.detail.overview.noSubscriptionExposureDescription")}
            />
          )}
        </div>
      </Card>

      <Card className="xl:col-span-2">
        <SectionHeader
          title={t("plans.detail.overview.versionExposure")}
          description={t("plans.detail.overview.versionExposureDescription")}
        />
        <div className="mt-5">
          {data.subscriptionBreakdown.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>{t("plans.detail.overview.versionHeader")}</TableHeaderCell>
                  <TableHeaderCell>{t("plans.detail.overview.statusHeader")}</TableHeaderCell>
                  <TableHeaderCell className="text-end">
                    {t("plans.detail.overview.subscriptionsHeader")}
                  </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.subscriptionBreakdown.map((item) => (
                  <TableRow key={`${item.planVersionId}-${item.status}`}>
                    <TableCell className="font-medium text-neutral-900">
                      {item.versionNumber === null
                        ? t("plans.detail.overview.unknownVersion")
                        : `v${item.versionNumber}`}
                    </TableCell>
                    <TableCell>
                      <StatusIndicator
                        tone={getSubscriptionStatusTone(item.status)}
                        label={enumLabel(t, item.status)}
                      />
                    </TableCell>
                    <TableCell className="text-end">
                      <NumericText size="sm">{formatNumber(item.count)}</NumericText>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title={t("plans.detail.overview.noVersionExposure")}
              description={t("plans.detail.overview.noVersionExposureDescription")}
            />
          )}
        </div>
      </Card>
    </div>
  );
}

function VersionsTab({ versions }: { versions: PlanVersionDetail[] }) {
  const { t } = useI18n();
  if (versions.length === 0) {
    return (
      <EmptyState
        icon={<BookOpenCheck className="size-5" />}
        title={t("plans.detail.versions.noVersionsTitle")}
        description={t("plans.detail.versions.noVersionsDescription")}
      />
    );
  }

  return (
    <Card>
      <SectionHeader
        title={t("plans.detail.versions.timelineTitle")}
        description={t("plans.detail.versions.timelineDescription")}
        badge={
          <Badge tone="neutral">
            {t("plans.detail.versions.count", { count: formatNumber(versions.length) })}
          </Badge>
        }
      />
      <div className="mt-7">
        <Timeline
          items={versions.map((version) => {
            const dateRange = formatDateRange(
              version.effectiveFrom,
              version.effectiveTo,
              t,
            );
            const description = version.changeNotes
              ? `${enumLabel(t, version.status)} · ${dateRange} · ${version.changeNotes}`
              : `${enumLabel(t, version.status)} · ${dateRange}`;
            return {
              title: version.title
                ? t("plans.detail.versions.versionWithTitle", {
                    number: version.versionNumber,
                    title: version.title,
                  })
                : t("plans.detail.versions.versionPlain", {
                    number: version.versionNumber,
                  }),
              description,
              timestamp: t("plans.detail.versions.createdAt", {
                date: formatDateTime(version.createdAt, t),
              }),
              tone: getVersionStatusTone(version.status),
            };
          })}
        />
      </div>
    </Card>
  );
}

function PricingTab({ data }: { data: PlanDetailData }) {
  const { t } = useI18n();
  if (data.prices.length === 0) {
    return (
      <EmptyState
        icon={<BadgeDollarSign className="size-5" />}
        title={t("plans.detail.pricing.noPricingTitle")}
        description={t("plans.detail.pricing.noPricingDescription")}
      />
    );
  }

  return (
    <div className="space-y-5">
      {data.versions.map((version) => {
        const prices = data.prices.filter(
          (price) => price.planVersionId === version.id,
        );

        if (prices.length === 0) return null;

        return (
          <Card key={version.id}>
            <SectionHeader
              title={t("plans.detail.pricing.versionPricingTitle", {
                number: version.versionNumber,
              })}
              description={formatDateRange(version.effectiveFrom, version.effectiveTo, t)}
              badge={
                <Badge tone={getVersionStatusTone(version.status)}>
                  {enumLabel(t, version.status)}
                </Badge>
              }
            />
            <div className="mt-5">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>{t("plans.detail.pricing.currency")}</TableHeaderCell>
                    <TableHeaderCell>{t("plans.detail.pricing.amount")}</TableHeaderCell>
                    <TableHeaderCell>{t("plans.detail.pricing.billing")}</TableHeaderCell>
                    <TableHeaderCell>{t("plans.detail.pricing.trial")}</TableHeaderCell>
                    <TableHeaderCell>{t("plans.common.status")}</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {prices.map((price) => (
                    <TableRow key={price.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Code>{price.currency}</Code>
                          {price.isDefault && (
                            <Badge tone="primary" size="sm">
                              {t("plans.common.default")}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <NumericText size="sm">
                          {formatMoney(price.amount, price.currency)}
                        </NumericText>
                      </TableCell>
                      <TableCell>
                        <Text size="sm" weight="medium">
                          {enumLabel(t, price.priceType)}
                        </Text>
                        <Text size="xs" tone="subtle" className="mt-0.5">
                          {formatInterval(
                            price.billingInterval,
                            price.billingIntervalCount,
                            t,
                          )}
                        </Text>
                      </TableCell>
                      <TableCell>
                        {price.trialDays && price.trialDays > 0
                          ? t("plans.common.days", { count: price.trialDays })
                          : t("plans.detail.pricing.noTrial")}
                      </TableCell>
                      <TableCell>
                        <Badge tone={price.isActive ? "success" : "neutral"}>
                          {price.isActive
                            ? t("plans.common.active")
                            : t("plans.common.inactive")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function describeStructuredValue(value: unknown, t: TFunction) {
  if (value === null || value === undefined) return t("plans.detail.structured.none");
  if (Array.isArray(value))
    return t("plans.detail.structured.configuredValues", { count: value.length });
  if (typeof value === "object") {
    return t("plans.detail.structured.nestedSettings", {
      count: Object.keys(value as Record<string, unknown>).length,
    });
  }
  if (typeof value === "boolean")
    return value
      ? t("plans.detail.structured.enabled")
      : t("plans.detail.structured.disabled");
  return String(value);
}

function ConfigRows({ config }: { config: unknown }) {
  const { t } = useI18n();
  if (!config || typeof config !== "object" || Array.isArray(config)) return null;

  const entries = Object.entries(config as Record<string, unknown>).slice(0, 8);
  if (entries.length === 0) return null;

  return (
    <div className="mt-5 rounded-[var(--radius-md)] border border-neutral-100 bg-neutral-50 p-4">
      <Text size="xs" weight="semibold">
        {t("plans.detail.structured.configuration")}
      </Text>
      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div key={key}>
            <dt className="text-xs font-medium text-neutral-400">{titleize(key)}</dt>
            <dd className="mt-0.5 text-sm font-medium text-neutral-700">
              {describeStructuredValue(value, t)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function LimitsTable({ limits }: { limits: PlanLimitDetail[] }) {
  const { t } = useI18n();
  if (limits.length === 0) return null;

  return (
    <div className="mt-5">
      <Text size="xs" weight="semibold" className="mb-2">
        {t("plans.detail.limits.title")}
      </Text>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{t("plans.detail.limits.allowance")}</TableHeaderCell>
            <TableHeaderCell>{t("plans.detail.limits.period")}</TableHeaderCell>
            <TableHeaderCell>{t("plans.detail.limits.behavior")}</TableHeaderCell>
            <TableHeaderCell>{t("plans.detail.limits.overageUnit")}</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {limits.map((limit) => (
            <TableRow key={limit.id}>
              <TableCell className="font-medium text-neutral-900">
                {limit.limitValue === null
                  ? t("plans.common.unlimited")
                  : formatNumber(limit.limitValue)}
              </TableCell>
              <TableCell>
                {limit.period === "none"
                  ? t("plans.detail.limits.noResetPeriod")
                  : t("plans.detail.limits.perPeriod", {
                      period: enumLabel(t, limit.period),
                    })}
              </TableCell>
              <TableCell>{enumLabel(t, limit.behavior)}</TableCell>
              <TableCell>
                {limit.overageUnitPrice === null
                  ? t("plans.detail.limits.noOveragePrice")
                  : t("plans.common.minorUnits", {
                      count: formatNumber(limit.overageUnitPrice),
                    })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PricingRulesTable({ rules }: { rules: FeaturePricingRuleDetail[] }) {
  const { t } = useI18n();
  if (rules.length === 0) return null;

  return (
    <div className="mt-5">
      <Text size="xs" weight="semibold" className="mb-2">
        {t("plans.detail.pricingRules.title")}
      </Text>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{t("plans.detail.pricingRules.metric")}</TableHeaderCell>
            <TableHeaderCell>{t("plans.detail.pricingRules.model")}</TableHeaderCell>
            <TableHeaderCell>{t("plans.detail.pricingRules.unitPrice")}</TableHeaderCell>
            <TableHeaderCell>{t("plans.detail.pricingRules.creditCost")}</TableHeaderCell>
            <TableHeaderCell>{t("plans.detail.pricingRules.minimum")}</TableHeaderCell>
            <TableHeaderCell>{t("plans.detail.pricingRules.structure")}</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rules.map((rule) => (
            <TableRow key={rule.id}>
              <TableCell className="font-medium text-neutral-900">
                {enumLabel(t, rule.metric)}
              </TableCell>
              <TableCell>{enumLabel(t, rule.pricingModel)}</TableCell>
              <TableCell>
                {rule.unitPrice !== null && rule.currency
                  ? formatMoney(rule.unitPrice, rule.currency)
                  : t("plans.detail.pricingRules.notMonetary")}
              </TableCell>
              <TableCell>
                {rule.creditCostPerUnit === null
                  ? t("plans.detail.pricingRules.noCreditCharge")
                  : t("plans.common.credits", {
                      count: formatNumber(rule.creditCostPerUnit),
                    })}
              </TableCell>
              <TableCell>
                {rule.minimumCharge !== null && rule.currency
                  ? formatMoney(rule.minimumCharge, rule.currency)
                  : t("plans.detail.pricingRules.noMinimum")}
              </TableCell>
              <TableCell>{describeStructuredValue(rule.tiers, t)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function FeatureItem({ feature }: { feature: PlanFeatureDetail }) {
  const { t } = useI18n();
  return (
    <AccordionItem value={feature.id}>
      <AccordionTrigger>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 pe-4">
          <span className="font-semibold text-neutral-900">{feature.name}</span>
          <Code className="text-[0.6875rem]">{feature.code}</Code>
          <Badge tone="neutral" size="sm">
            {enumLabel(t, feature.kind)}
          </Badge>
          <Badge tone={feature.isIncluded ? "success" : "neutral"} size="sm">
            {feature.isIncluded
              ? t("plans.detail.features.included")
              : t("plans.detail.features.excluded")}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="rounded-[var(--radius-md)] bg-neutral-50/70 p-4">
          <Text size="sm" tone="muted">
            {feature.description || t("plans.detail.features.noDescription")}
          </Text>
          <div className="mt-4">
            <DescriptionList
              items={[
                {
                  term: t("plans.detail.features.capabilityType"),
                  description: enumLabel(t, feature.kind),
                },
                {
                  term: t("plans.detail.features.unit"),
                  description: feature.unitName || t("plans.common.notApplicable"),
                },
                {
                  term: t("plans.detail.features.limitRules"),
                  description:
                    feature.limits.length > 0
                      ? t("plans.detail.features.configured", {
                          count: formatNumber(feature.limits.length),
                        })
                      : t("plans.detail.features.noRule"),
                },
                {
                  term: t("plans.detail.features.pricingRules"),
                  description:
                    feature.pricingRules.length > 0
                      ? t("plans.detail.features.configured", {
                          count: formatNumber(feature.pricingRules.length),
                        })
                      : t("plans.detail.features.noRule"),
                },
              ]}
            />
          </div>
          <LimitsTable limits={feature.limits} />
          <PricingRulesTable rules={feature.pricingRules} />
          <ConfigRows config={feature.config} />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function FeaturesTab({ data }: { data: PlanDetailData }) {
  const { t } = useI18n();
  const version = data.configurationVersion;
  const features = version
    ? data.features.filter((feature) => feature.planVersionId === version.id)
    : [];

  if (!version || features.length === 0) {
    return (
      <EmptyState
        icon={<Gauge className="size-5" />}
        title={t("plans.detail.features.noFeaturesTitle")}
        description={t("plans.detail.features.noFeaturesDescription")}
      />
    );
  }

  return (
    <Card>
      <SectionHeader
        title={t("plans.detail.features.entitlementsTitle")}
        description={t("plans.detail.features.entitlementsDescription")}
        badge={
          <Badge tone="primary">
            {t("plans.detail.features.versionFeatures", {
              version: version.versionNumber,
              count: formatNumber(features.length),
            })}
          </Badge>
        }
      />
      <Alert
        tone="info"
        className="mt-5"
        title={t("plans.detail.features.versionIsolatedTitle")}
      >
        {t("plans.detail.features.versionIsolatedBody", {
          version: version.versionNumber,
        })}
      </Alert>
      <div className="mt-3">
        <Accordion type="multiple">
          {features.map((feature) => (
            <FeatureItem key={feature.id} feature={feature} />
          ))}
        </Accordion>
      </div>
    </Card>
  );
}

function CreditsTab({ data }: { data: PlanDetailData }) {
  const { t } = useI18n();
  const version = data.configurationVersion;
  const policy = version
    ? data.creditPolicies.find((item) => item.planVersionId === version.id)
    : null;

  if (!version || !policy) {
    return (
      <EmptyState
        icon={<Coins className="size-5" />}
        title={t("plans.detail.credits.noPolicyTitle")}
        description={t("plans.detail.credits.noPolicyDescription")}
      />
    );
  }

  return (
    <div className="space-y-5">
      <Alert tone="info" title={t("plans.detail.credits.policyDefinitionTitle")}>
        {t("plans.detail.credits.policyDefinitionBody", {
          version: version.versionNumber,
        })}
      </Alert>
      <Card>
        <SectionHeader
          title={t("plans.detail.credits.creditPolicy")}
          description={t("plans.detail.credits.configurationForVersion", {
            version: version.versionNumber,
          })}
          badge={
            <Badge tone="primary">
              {t("plans.detail.credits.versionBadge", {
                version: version.versionNumber,
              })}
            </Badge>
          }
        />
        <div className="mt-6">
          <DescriptionList
            items={[
              {
                term: t("plans.detail.credits.monthlyGrant"),
                description: t("plans.common.credits", {
                  count: formatNumber(policy.monthlyCreditGrant),
                }),
              },
              {
                term: t("plans.detail.credits.resetPolicy"),
                description: enumLabel(t, policy.resetPolicy),
              },
              {
                term: t("plans.detail.credits.rollover"),
                description: policy.rolloverEnabled
                  ? t("plans.detail.structured.enabled")
                  : t("plans.detail.structured.disabled"),
              },
              {
                term: t("plans.detail.credits.rolloverCap"),
                description:
                  policy.rolloverCap === null
                    ? policy.rolloverEnabled
                      ? t("plans.common.unlimited")
                      : t("plans.common.notApplicable")
                    : t("plans.common.credits", {
                        count: formatNumber(policy.rolloverCap),
                      }),
              },
              {
                term: t("plans.detail.credits.grantExpiry"),
                description:
                  policy.grantExpiryDays === null
                    ? t("plans.detail.credits.noExplicitExpiry")
                    : t("plans.common.days", { count: policy.grantExpiryDays }),
              },
              {
                term: t("plans.detail.credits.negativeBalance"),
                description: policy.negativeBalanceAllowed
                  ? policy.maxNegativeBalance === null
                    ? t("plans.detail.credits.allowed")
                    : t("plans.detail.credits.allowedUpTo", {
                        count: formatNumber(policy.maxNegativeBalance),
                      })
                  : t("plans.detail.credits.blocked"),
              },
            ]}
          />
        </div>
      </Card>
    </div>
  );
}

function AddonsTab({ data }: { data: PlanDetailData }) {
  const { t } = useI18n();
  if (data.addons.length === 0) {
    return (
      <EmptyState
        icon={<Boxes className="size-5" />}
        title={t("plans.detail.addons.noAddonsTitle")}
        description={t("plans.detail.addons.noAddonsDescription")}
      />
    );
  }

  return (
    <Card>
      <SectionHeader
        title={t("plans.detail.addons.relatedAddons")}
        description={t("plans.detail.addons.relatedAddonsDescription")}
        badge={
          <Badge tone="neutral">
            {t("plans.detail.addons.count", { count: formatNumber(data.addons.length) })}
          </Badge>
        }
      />
      <div className="mt-5">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{t("plans.detail.addons.addon")}</TableHeaderCell>
              <TableHeaderCell>{t("plans.detail.addons.scope")}</TableHeaderCell>
              <TableHeaderCell>{t("plans.detail.addons.attachment")}</TableHeaderCell>
              <TableHeaderCell>{t("plans.detail.addons.activePricing")}</TableHeaderCell>
              <TableHeaderCell>{t("plans.common.status")}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.addons.map((addon) => {
              const activePrices = addon.prices.filter((price) => price.isActive);

              return (
                <TableRow key={addon.id}>
                  <TableCell>
                    <Text size="sm" weight="semibold">
                      {addon.name}
                    </Text>
                    <div className="mt-1 flex items-center gap-2">
                      <Code className="text-[0.6875rem]">{addon.code}</Code>
                      <Text size="xs" tone="subtle" className="line-clamp-1">
                        {addon.description || t("plans.detail.addons.noDescription")}
                      </Text>
                    </div>
                  </TableCell>
                  <TableCell>{enumLabel(t, addon.scope)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {addon.isRequired && (
                        <Badge tone="warning" size="sm">
                          {t("plans.detail.addons.required")}
                        </Badge>
                      )}
                      {addon.isDefault && (
                        <Badge tone="primary" size="sm">
                          {t("plans.common.default")}
                        </Badge>
                      )}
                      {!addon.isRequired && !addon.isDefault && (
                        <Badge tone="neutral" size="sm">
                          {t("plans.detail.addons.optional")}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {activePrices.length > 0 ? (
                      <div className="space-y-1">
                        {activePrices.slice(0, 2).map((price) => (
                          <Text key={price.id} size="xs" weight="medium">
                            {formatMoney(price.amount, price.currency)}{" "}
                            {formatInterval(
                              price.billingInterval,
                              price.billingIntervalCount,
                              t,
                            )}
                          </Text>
                        ))}
                        {activePrices.length > 2 && (
                          <Text size="xs" tone="subtle">
                            {t("plans.detail.addons.morePriceRows", {
                              count: activePrices.length - 2,
                            })}
                          </Text>
                        )}
                      </div>
                    ) : (
                      t("plans.detail.addons.noActivePrice")
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge tone={addon.isActive ? "success" : "neutral"}>
                      {addon.isActive
                        ? t("plans.common.active")
                        : t("plans.common.inactive")}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function ChangeRulesTable({
  rules,
  emptyTitle,
  emptyDescription,
}: {
  rules: PlanChangeRuleDetail[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  const { t } = useI18n();
  if (rules.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{t("plans.detail.changeRules.relatedPlan")}</TableHeaderCell>
          <TableHeaderCell>{t("plans.detail.changeRules.decision")}</TableHeaderCell>
          <TableHeaderCell>{t("plans.detail.changeRules.proration")}</TableHeaderCell>
          <TableHeaderCell>{t("plans.detail.changeRules.credits")}</TableHeaderCell>
          <TableHeaderCell>{t("plans.detail.changeRules.changeFee")}</TableHeaderCell>
          <TableHeaderCell>{t("plans.detail.changeRules.conditions")}</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rules.map((rule) => (
          <TableRow key={rule.id}>
            <TableCell>
              <LocalizedLink
                href={`/plans/${rule.relatedPlanId}`}
                className="font-semibold text-neutral-900 hover:text-primary-700 hover:underline hover:decoration-primary-200 hover:underline-offset-4"
              >
                {rule.relatedPlanName}
              </LocalizedLink>
              <div className="mt-1 flex items-center gap-2">
                <Code className="text-[0.6875rem]">{rule.relatedPlanCode}</Code>
                <Badge tone={getPlanStatusTone(rule.relatedPlanStatus)} size="sm">
                  {enumLabel(t, rule.relatedPlanStatus)}
                </Badge>
              </div>
            </TableCell>
            <TableCell>
              <Badge tone={rule.allowChange ? "success" : "danger"}>
                {rule.allowChange
                  ? t("plans.detail.changeRules.allowed")
                  : t("plans.detail.changeRules.blocked")}
              </Badge>
            </TableCell>
            <TableCell>{enumLabel(t, rule.prorationMode)}</TableCell>
            <TableCell>
              {rule.carryUnusedCredits
                ? t("plans.detail.changeRules.carryUnused")
                : t("plans.detail.changeRules.doNotCarry")}
            </TableCell>
            <TableCell>
              {rule.changeFeeAmount === null
                ? t("plans.detail.changeRules.noFee")
                : rule.currency
                  ? formatMoney(rule.changeFeeAmount, rule.currency)
                  : t("plans.common.minorUnits", {
                      count: formatNumber(rule.changeFeeAmount),
                    })}
            </TableCell>
            <TableCell>{describeStructuredValue(rule.ruleConfig, t)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ChangeRulesTab({ data }: { data: PlanDetailData }) {
  const { t } = useI18n();
  const outbound = data.changeRules.filter((rule) => rule.direction === "outbound");
  const inbound = data.changeRules.filter((rule) => rule.direction === "inbound");

  return (
    <div className="space-y-6">
      <Card>
        <SectionHeader
          title={t("plans.detail.changeRules.outboundTitle")}
          description={t("plans.detail.changeRules.outboundDescription")}
          badge={
            <div className="flex items-center gap-2">
              <ArrowUpRight className="size-4 text-neutral-400" />
              <Badge tone="neutral">
                {t("plans.detail.changeRules.rulesCount", {
                  count: formatNumber(outbound.length),
                })}
              </Badge>
            </div>
          }
        />
        <div className="mt-5">
          <ChangeRulesTable
            rules={outbound}
            emptyTitle={t("plans.detail.changeRules.noOutboundTitle")}
            emptyDescription={t("plans.detail.changeRules.noOutboundDescription")}
          />
        </div>
      </Card>

      <Card>
        <SectionHeader
          title={t("plans.detail.changeRules.inboundTitle")}
          description={t("plans.detail.changeRules.inboundDescription")}
          badge={
            <div className="flex items-center gap-2">
              <ArrowDownLeft className="size-4 text-neutral-400" />
              <Badge tone="neutral">
                {t("plans.detail.changeRules.rulesCount", {
                  count: formatNumber(inbound.length),
                })}
              </Badge>
            </div>
          }
        />
        <div className="mt-5">
          <ChangeRulesTable
            rules={inbound}
            emptyTitle={t("plans.detail.changeRules.noInboundTitle")}
            emptyDescription={t("plans.detail.changeRules.noInboundDescription")}
          />
        </div>
      </Card>
    </div>
  );
}

export function PlanDetail({ data }: { data: PlanDetailData }) {
  const { t } = useI18n();
  const { plan, currentVersion, configurationVersion, defaultPrice } = data;

  return (
    <div className="space-y-6 p-6 max-sm:p-4">
      <Breadcrumb
        items={[
          { label: t("plans.list.title"), href: "/plans" },
          { label: plan.name },
        ]}
      />

      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <Heading level={2}>{plan.name}</Heading>
            <Badge tone={getPlanStatusTone(plan.status)}>{enumLabel(t, plan.status)}</Badge>
            <Badge tone={plan.isPublic ? "primary" : "neutral"}>
              {plan.isPublic
                ? t("plans.common.public")
                : t("plans.common.private")}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Code>{plan.code}</Code>
            <Text size="xs" tone="subtle">
              {t("plans.detail.updated", { date: formatDateTime(plan.updatedAt, t) })}
            </Text>
          </div>
          <Text tone="muted" size="sm" className="mt-3 max-w-3xl">
            {plan.description || t("plans.detail.noDescription")}
          </Text>
        </div>

        <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-neutral-200 bg-neutral-0 px-4 py-3 shadow-[var(--shadow-xs)]">
          <Route className="size-4 text-neutral-400" />
          <div>
            <Text size="xs" weight="semibold">
              {t("plans.detail.configurationSource")}
            </Text>
            <Text size="xs" tone="muted" className="mt-0.5">
              {configurationVersion
                ? t("plans.detail.configurationVersionValue", {
                    version: configurationVersion.versionNumber,
                    status: enumLabel(t, configurationVersion.status),
                  })
                : t("plans.detail.noVersionAvailable")}
            </Text>
          </div>
        </div>
      </div>

      {!currentVersion && (
        <Alert tone="warning" title={t("plans.detail.noCurrentVersionTitle")}>
          {t("plans.detail.noCurrentVersionBody")}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <SummaryCard
          label={t("plans.detail.summary.currentPublishedVersion")}
          value={
            currentVersion ? (
              <NumericText size="xl">v{currentVersion.versionNumber}</NumericText>
            ) : (
              <Text size="lg" weight="semibold">
                {t("plans.detail.summary.notPublished")}
              </Text>
            )
          }
          helper={
            currentVersion
              ? formatDateRange(
                  currentVersion.effectiveFrom,
                  currentVersion.effectiveTo,
                  t,
                )
              : t("plans.detail.summary.requiresPublished")
          }
          icon={<BookOpenCheck className="size-4" />}
        />
        <SummaryCard
          label={t("plans.detail.summary.activeSubscribers")}
          value={<NumericText size="xl">{formatNumber(data.activeSubscribers)}</NumericText>}
          helper={t("plans.detail.summary.activeExposureHelper")}
          icon={<Users className="size-4" />}
        />
        <SummaryCard
          label={t("plans.detail.summary.defaultPrice")}
          value={
            defaultPrice ? (
              <NumericText size="lg">
                {formatMoney(defaultPrice.amount, defaultPrice.currency)}
              </NumericText>
            ) : (
              <Text size="lg" weight="semibold">
                {t("plans.detail.summary.notPriced")}
              </Text>
            )
          }
          helper={
            defaultPrice
              ? t("plans.detail.summary.priceBreakdown", {
                  priceType: enumLabel(t, defaultPrice.priceType),
                  interval: formatInterval(
                    defaultPrice.billingInterval,
                    defaultPrice.billingIntervalCount,
                    t,
                  ),
                })
              : t("plans.detail.summary.noDefaultPrice")
          }
          icon={<BadgeDollarSign className="size-4" />}
        />
        <SummaryCard
          label={t("plans.detail.summary.monthlyCreditGrant")}
          value={
            data.monthlyCreditGrant !== null ? (
              <NumericText size="xl">
                {formatNumber(data.monthlyCreditGrant)}
              </NumericText>
            ) : (
              <Text size="lg" weight="semibold">
                {t("plans.detail.summary.noPolicy")}
              </Text>
            )
          }
          helper={t("plans.detail.summary.monthlyGrantHelper")}
          icon={<Coins className="size-4" />}
        />
      </div>

      <PlanDetailTabs
        tabs={[
          {
            value: "overview",
            label: t("plans.detail.tabs.overview"),
            content: <OverviewTab data={data} />,
          },
          {
            value: "versions",
            label: t("plans.detail.tabs.versions"),
            content: <VersionsTab versions={data.versions} />,
          },
          {
            value: "pricing",
            label: t("plans.detail.tabs.pricing"),
            content: <PricingTab data={data} />,
          },
          {
            value: "features",
            label: t("plans.detail.tabs.features"),
            content: <FeaturesTab data={data} />,
          },
          {
            value: "credits",
            label: t("plans.detail.tabs.credits"),
            content: <CreditsTab data={data} />,
          },
          {
            value: "addons",
            label: t("plans.detail.tabs.addons"),
            content: <AddonsTab data={data} />,
          },
          {
            value: "rules",
            label: t("plans.detail.tabs.changeRules"),
            content: <ChangeRulesTab data={data} />,
          },
        ]}
      />
    </div>
  );
}
