"use client";

import { useActionState, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowLeft,
  Boxes,
  Coins,
  Gauge,
  Network,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/actions";
import { ChartContainer, ChartEmptyState, ChartHeader, Sparkline } from "@/components/ui/charts";
import {
  Badge,
  Card,
  CodeBlock,
  DescriptionList,
  StatusIndicator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/data-display";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { Switch } from "@/components/ui/form-controls";
import { Field, Textarea, TextInput } from "@/components/ui/inputs";
import { Breadcrumb } from "@/components/ui/navigation";
import { Select } from "@/components/ui/select-combobox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/selection";
import { Code, Heading, NumericText, Text } from "@/components/ui/typography";
import { LocalizedLink, useI18n } from "@/i18n/client";
import type { TFunction } from "@/i18n/translate";
import {
  addFeatureDependency,
  removeFeatureDependency,
  saveFeaturePlanPolicy,
  updateFeature,
} from "../actions";
import { readDefaultAccess, resolveOptionalFeaturePolicy } from "../policy";
import type {
  FeatureActionState,
  FeatureDetailData,
  FeatureKind,
  FeaturePlanPolicyDetail,
} from "../types";
import {
  formatDateTime,
  formatNumber,
  getFeatureKindTone,
} from "./feature-formatters";

const initialState: FeatureActionState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

function kindLabels(t: TFunction): Record<FeatureKind, string> {
  return {
    boolean: t("features.kindLabel.boolean"),
    metered: t("features.kindLabel.metered"),
    quota: t("features.kindLabel.quota"),
    package: t("features.kindLabel.package"),
  };
}

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
      <div className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-neutral-100 text-neutral-500">
        {icon}
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

function ActionMessage({ state }: { state: FeatureActionState }) {
  const { t } = useI18n();
  if (state.status === "idle") return null;
  return (
    <Alert
      tone={state.status === "success" ? "success" : "danger"}
      title={
        state.status === "success"
          ? t("features.detail.changeCommitted")
          : t("features.detail.changeRejected")
      }
    >
      {state.message}
    </Alert>
  );
}

function OverviewTab({ data }: { data: FeatureDetailData }) {
  const { t } = useI18n();
  const defaultAccess = readDefaultAccess(data.feature.metadata) ?? "allow";
  const fallback = resolveOptionalFeaturePolicy({
    featureActive: data.feature.isActive,
    defaultAccess,
  });
  const kindName = kindLabels(t);
  const accessSourceLabels = {
    system_default: t("features.detail.overview.accessSource.systemDefault"),
    feature_status: t("features.detail.overview.accessSource.featureStatus"),
    plan_override: t("features.detail.overview.accessSource.planOverride"),
    feature_default: t("features.detail.overview.accessSource.featureDefault"),
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <SummaryCard
          label={t("features.detail.tabs.policies")}
          value={<NumericText size="xl">{formatNumber(data.planPolicies.length)}</NumericText>}
          helper={t("features.detail.overview.planPoliciesHelper")}
          icon={<ShieldCheck className="size-4" />}
        />
        <SummaryCard
          label={t("features.detail.overview.usage30d")}
          value={<NumericText size="xl">{formatNumber(data.usage.quantity30d)}</NumericText>}
          helper={t("features.detail.overview.usageEvents", {
            count: formatNumber(data.usage.events30d),
          })}
          icon={<Activity className="size-4" />}
        />
        <SummaryCard
          label={t("features.detail.overview.credits30d")}
          value={<NumericText size="xl">{formatNumber(data.usage.credits30d)}</NumericText>}
          helper={t("features.detail.overview.activeUsers", {
            count: formatNumber(data.usage.activeUsers30d),
          })}
          icon={<Coins className="size-4" />}
        />
        <SummaryCard
          label={t("features.detail.overview.dependencyHealth")}
          value={
            <StatusIndicator
              tone={data.catalogHealth.hasCycle ? "danger" : "success"}
              label={
                data.catalogHealth.hasCycle
                  ? t("features.detail.overview.cycleDetected")
                  : t("features.detail.overview.healthy")
              }
            />
          }
          helper={t("features.detail.overview.dependencyCounts", {
            outbound: data.dependencies.length,
            inbound: data.requiredBy.length,
          })}
          icon={<Network className="size-4" />}
        />
      </div>

      {data.catalogHealth.hasCycle && (
        <Alert tone="danger" title={t("features.detail.overview.cycleTitle")}>
          {data.catalogHealth.cyclePaths
            .map((path) => [...path, path[0]].join(" → "))
            .join(" · ")}
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <Heading level={6}>{t("features.detail.overview.capabilityContract")}</Heading>
          <Text size="xs" tone="muted" className="mt-1">
            {t("features.detail.overview.capabilityContractSub")}
          </Text>
          <div className="mt-6">
            <DescriptionList
              items={[
                { term: t("features.stableCode"), description: <Code>{data.feature.code}</Code> },
                {
                  term: t("features.detail.overview.type"),
                  description: (
                    <Badge tone={getFeatureKindTone(data.feature.kind)}>
                      {kindName[data.feature.kind]}
                    </Badge>
                  ),
                },
                {
                  term: t("features.detail.overview.unit"),
                  description:
                    data.feature.unitName || t("features.detail.overview.noUnitRequired"),
                },
                {
                  term: t("features.detail.overview.globalStatus"),
                  description: (
                    <StatusIndicator
                      tone={data.feature.isActive ? "success" : "neutral"}
                      label={
                        data.feature.isActive
                          ? t("features.active")
                          : t("features.inactive")
                      }
                    />
                  ),
                },
                {
                  term: t("features.detail.overview.created"),
                  description: formatDateTime(data.feature.createdAt),
                },
                {
                  term: t("features.detail.overview.updated"),
                  description: formatDateTime(data.feature.updatedAt),
                },
              ]}
            />
          </div>
        </Card>

        <Card>
          <Heading level={6}>{t("features.detail.overview.fallbackBehavior")}</Heading>
          <Text size="xs" tone="muted" className="mt-1">
            {t("features.detail.overview.fallbackBehaviorSub")}
          </Text>
          <div className="mt-6">
            <DescriptionList
              items={[
                {
                  term: t("features.access"),
                  description:
                    fallback.access === "allow"
                      ? t("features.allowedByDefault")
                      : t("features.deniedByDefault"),
                },
                { term: t("features.usageLimit"), description: t("features.unlimited") },
                {
                  term: t("features.detail.overview.creditCost"),
                  description: t("features.detail.overview.zeroCredits"),
                },
                {
                  term: t("features.detail.overview.moneyCost"),
                  description: t("features.detail.overview.zeroMinorUnits"),
                },
                {
                  term: t("features.detail.overview.source"),
                  description: accessSourceLabels[fallback.accessSource],
                },
              ]}
            />
          </div>
        </Card>
      </div>

      <Card>
        <Heading level={6}>{t("features.description")}</Heading>
        <Text size="sm" tone="muted" className="mt-3 whitespace-pre-wrap">
          {data.feature.description || t("features.table.noDescription")}
        </Text>
      </Card>
    </div>
  );
}

function PolicyEditor({
  data,
  selectedPolicy,
  selectedPlanVersionId,
  onPlanVersionChange,
}: {
  data: FeatureDetailData;
  selectedPolicy: FeaturePlanPolicyDetail | null;
  selectedPlanVersionId: string;
  onPlanVersionChange: (value: string) => void;
}) {
  const { t, locale } = useI18n();
  const action = saveFeaturePlanPolicy.bind(null, data.feature.id);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [accessMode, setAccessMode] = useState(
    selectedPolicy?.isIncluded === null || selectedPolicy?.isIncluded === undefined
      ? "inherit"
      : selectedPolicy.isIncluded
        ? "allow"
        : "deny",
  );
  const initialLimit = selectedPolicy?.limits[0];
  const initialPricing = selectedPolicy?.pricingRules[0];
  const [featureConfigJson, setFeatureConfigJson] = useState(
    JSON.stringify(selectedPolicy?.config ?? {}, null, 2),
  );
  const [limitMode, setLimitMode] = useState(initialLimit ? "custom" : "unlimited");
  const [limitValue, setLimitValue] = useState(initialLimit?.limitValue ?? "");
  const [period, setPeriod] = useState(initialLimit?.period ?? "none");
  const [behavior, setBehavior] = useState(initialLimit?.behavior ?? "block");
  const [overageUnitPrice, setOverageUnitPrice] = useState(
    initialLimit?.overageUnitPrice ?? "",
  );
  const [limitMetadataJson, setLimitMetadataJson] = useState(
    JSON.stringify(initialLimit?.metadata ?? {}, null, 2),
  );
  const [pricingMode, setPricingMode] = useState(initialPricing ? "custom" : "free");
  const [metric, setMetric] = useState(initialPricing?.metric ?? "unit");
  const [pricingModel, setPricingModel] = useState(
    initialPricing?.pricingModel ?? "flat",
  );
  const [currency, setCurrency] = useState(initialPricing?.currency ?? "");
  const [unitPrice, setUnitPrice] = useState(initialPricing?.unitPrice ?? "");
  const [creditCostPerUnit, setCreditCostPerUnit] = useState(
    initialPricing?.creditCostPerUnit ?? "",
  );
  const [minimumCharge, setMinimumCharge] = useState(
    initialPricing?.minimumCharge ?? "",
  );
  const [tiersJson, setTiersJson] = useState(
    JSON.stringify(initialPricing?.tiers ?? [], null, 2),
  );
  const [pricingMetadataJson, setPricingMetadataJson] = useState(
    JSON.stringify(initialPricing?.metadata ?? {}, null, 2),
  );

  const loadVersion = (value: string) => {
    onPlanVersionChange(value);
    const policy = data.planPolicies.find((item) => item.planVersionId === value);
    const limit = policy?.limits[0];
    const pricing = policy?.pricingRules[0];
    setAccessMode(
      policy?.isIncluded === null || policy?.isIncluded === undefined
        ? "inherit"
        : policy.isIncluded
          ? "allow"
          : "deny",
    );
    setFeatureConfigJson(JSON.stringify(policy?.config ?? {}, null, 2));
    setLimitMode(limit ? "custom" : "unlimited");
    setLimitValue(limit?.limitValue ?? "");
    setPeriod(limit?.period ?? "none");
    setBehavior(limit?.behavior ?? "block");
    setOverageUnitPrice(limit?.overageUnitPrice ?? "");
    setLimitMetadataJson(JSON.stringify(limit?.metadata ?? {}, null, 2));
    setPricingMode(pricing ? "custom" : "free");
    setMetric(pricing?.metric ?? "unit");
    setPricingModel(pricing?.pricingModel ?? "flat");
    setCurrency(pricing?.currency ?? "");
    setUnitPrice(pricing?.unitPrice ?? "");
    setCreditCostPerUnit(pricing?.creditCostPerUnit ?? "");
    setMinimumCharge(pricing?.minimumCharge ?? "");
    setTiersJson(JSON.stringify(pricing?.tiers ?? [], null, 2));
    setPricingMetadataJson(JSON.stringify(pricing?.metadata ?? {}, null, 2));
  };

  if (!selectedPlanVersionId) {
    return (
      <EmptyState
        title={t("features.detail.policy.noVersions")}
        description={t("features.detail.policy.noVersionsDescription")}
      />
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="planVersionId" value={selectedPlanVersionId} />
      <input type="hidden" name="accessMode" value={accessMode} />
      <input type="hidden" name="limitMode" value={limitMode} />
      <input type="hidden" name="period" value={period} />
      <input type="hidden" name="behavior" value={behavior} />
      <input type="hidden" name="pricingMode" value={pricingMode} />
      <input type="hidden" name="metric" value={metric} />
      <input type="hidden" name="pricingModel" value={pricingModel} />

      <ActionMessage state={state} />
      <Field label={t("features.planVersion")} required>
        <Select
          value={selectedPlanVersionId}
          onValueChange={loadVersion}
          options={data.availablePlanVersions.map((version) => ({
            value: version.id,
            label: version.label,
          }))}
        />
      </Field>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card padding="sm">
          <Heading level={6}>{t("features.access")}</Heading>
          <Text size="xs" tone="muted" className="mt-1">
            {t("features.detail.policy.accessSub")}
          </Text>
          <div className="mt-4 space-y-4">
            <Field label={t("features.detail.policy.accessMode")}>
              <Select
                value={accessMode}
                onValueChange={setAccessMode}
                options={[
                  { value: "inherit", label: t("features.detail.policy.inheritDefault") },
                  { value: "allow", label: t("features.detail.policy.explicitlyAllow") },
                  { value: "deny", label: t("features.detail.policy.explicitlyDeny") },
                ]}
              />
            </Field>
            <Field label={t("features.detail.policy.planFeatureConfig")}>
              <Textarea
                name="featureConfigJson"
                value={featureConfigJson}
                onChange={(event) => setFeatureConfigJson(event.target.value)}
                rows={8}
                className="font-mono text-xs"
              />
            </Field>
          </div>
        </Card>

        <Card padding="sm">
          <Heading level={6}>{t("features.usageLimit")}</Heading>
          <Text size="xs" tone="muted" className="mt-1">
            {t("features.detail.policy.usageLimitSub")}
          </Text>
          <div className="mt-4 space-y-4">
            <Field label={t("features.detail.policy.limitMode")}>
              <Select
                value={limitMode}
                onValueChange={setLimitMode}
                options={[
                  { value: "unlimited", label: t("features.detail.policy.unlimitedNoPolicy") },
                  { value: "custom", label: t("features.detail.policy.applyCustomLimit") },
                ]}
              />
            </Field>
            {limitMode === "custom" && (
              <>
                <Field label={t("features.detail.policy.limitValue")} required>
                  <TextInput
                    name="limitValue"
                    inputMode="numeric"
                    value={limitValue}
                    onChange={(event) => setLimitValue(event.target.value)}
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={t("features.detail.policy.period")}>
                    <Select
                      value={period}
                      onValueChange={(value) =>
                        setPeriod(value as typeof period)
                      }
                      options={[
                        { value: "none", label: t("features.detail.policy.lifetimeNoReset") },
                        { value: "day", label: t("features.detail.policy.daily") },
                        { value: "week", label: t("features.detail.policy.weekly") },
                        { value: "month", label: t("features.detail.policy.monthly") },
                      ]}
                    />
                  </Field>
                  <Field label={t("features.detail.policy.atLimit")}>
                    <Select
                      value={behavior}
                      onValueChange={(value) =>
                        setBehavior(value as typeof behavior)
                      }
                      options={[
                        { value: "block", label: t("features.detail.policy.blockUsage") },
                        { value: "allow_overage", label: t("features.detail.policy.allowOverage") },
                      ]}
                    />
                  </Field>
                </div>
                {behavior === "allow_overage" && (
                  <Field label={t("features.detail.policy.overageUnitPrice")} optional>
                    <TextInput
                      name="overageUnitPrice"
                      inputMode="numeric"
                      value={overageUnitPrice}
                      onChange={(event) => setOverageUnitPrice(event.target.value)}
                    />
                  </Field>
                )}
                <Field label={t("features.detail.policy.limitMetadata")}>
                  <Textarea
                    name="limitMetadataJson"
                    value={limitMetadataJson}
                    onChange={(event) => setLimitMetadataJson(event.target.value)}
                    rows={5}
                    className="font-mono text-xs"
                  />
                </Field>
              </>
            )}
            {limitMode === "unlimited" && (
              <>
                <input type="hidden" name="limitValue" value="" />
                <input type="hidden" name="overageUnitPrice" value="" />
                <input type="hidden" name="limitMetadataJson" value="{}" />
              </>
            )}
          </div>
        </Card>

        <Card padding="sm">
          <Heading level={6}>{t("features.detail.policy.pricingAndCredits")}</Heading>
          <Text size="xs" tone="muted" className="mt-1">
            {t("features.detail.policy.pricingSub")}
          </Text>
          <div className="mt-4 space-y-4">
            <Field label={t("features.detail.policy.pricingMode")}>
              <Select
                value={pricingMode}
                onValueChange={setPricingMode}
                options={[
                  { value: "free", label: t("features.detail.policy.freeNoPolicy") },
                  { value: "custom", label: t("features.detail.policy.applyUsagePricing") },
                ]}
              />
            </Field>
            {pricingMode === "custom" && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={t("features.detail.policy.metric")}>
                    <Select
                      value={metric}
                      onValueChange={(value) =>
                        setMetric(value as typeof metric)
                      }
                      options={[
                        { value: "unit", label: t("features.detail.policy.metricUnit") },
                        { value: "minute", label: t("features.detail.policy.metricMinute") },
                        { value: "megabyte", label: t("features.detail.policy.metricMegabyte") },
                        { value: "request", label: t("features.detail.policy.metricRequest") },
                        { value: "seat", label: t("features.detail.policy.metricSeat") },
                      ]}
                    />
                  </Field>
                  <Field label={t("features.detail.policy.model")}>
                    <Select
                      value={pricingModel}
                      onValueChange={(value) =>
                        setPricingModel(value as typeof pricingModel)
                      }
                      options={[
                        { value: "flat", label: t("features.detail.policy.modelFlat") },
                        { value: "tiered", label: t("features.detail.policy.modelTiered") },
                        { value: "volume", label: t("features.detail.policy.modelVolume") },
                      ]}
                    />
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={t("features.detail.policy.currency")} optional>
                    <TextInput
                      name="currency"
                      value={currency}
                      onChange={(event) => setCurrency(event.target.value.toUpperCase())}
                      maxLength={3}
                    />
                  </Field>
                  <Field label={t("features.detail.policy.moneyPerUnit")} optional>
                    <TextInput
                      name="unitPrice"
                      inputMode="numeric"
                      value={unitPrice}
                      onChange={(event) => setUnitPrice(event.target.value)}
                    />
                  </Field>
                  <Field label={t("features.detail.policy.creditsPerUnit")} optional>
                    <TextInput
                      name="creditCostPerUnit"
                      inputMode="numeric"
                      value={creditCostPerUnit}
                      onChange={(event) => setCreditCostPerUnit(event.target.value)}
                    />
                  </Field>
                  <Field label={t("features.detail.policy.minimumCharge")} optional>
                    <TextInput
                      name="minimumCharge"
                      inputMode="numeric"
                      value={minimumCharge}
                      onChange={(event) => setMinimumCharge(event.target.value)}
                    />
                  </Field>
                </div>
                <Field label={t("features.detail.policy.pricingTiers")}>
                  <Textarea
                    name="tiersJson"
                    value={tiersJson}
                    onChange={(event) => setTiersJson(event.target.value)}
                    rows={7}
                    className="font-mono text-xs"
                  />
                </Field>
                <Field label={t("features.detail.policy.pricingMetadata")}>
                  <Textarea
                    name="pricingMetadataJson"
                    value={pricingMetadataJson}
                    onChange={(event) => setPricingMetadataJson(event.target.value)}
                    rows={5}
                    className="font-mono text-xs"
                  />
                </Field>
              </>
            )}
            {pricingMode === "free" && (
              <>
                <input type="hidden" name="currency" value="" />
                <input type="hidden" name="unitPrice" value="" />
                <input type="hidden" name="creditCostPerUnit" value="" />
                <input type="hidden" name="minimumCharge" value="" />
                <input type="hidden" name="tiersJson" value="[]" />
                <input type="hidden" name="pricingMetadataJson" value="{}" />
              </>
            )}
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          loading={pending}
          leadingIcon={<Save className="size-4" />}
        >
          {t("features.detail.policy.saveAtomically")}
        </Button>
      </div>
    </form>
  );
}

function PoliciesTab({ data }: { data: FeatureDetailData }) {
  const { t } = useI18n();
  const [selectedPlanVersionId, setSelectedPlanVersionId] = useState(
    data.planPolicies[0]?.planVersionId ?? data.availablePlanVersions[0]?.id ?? "",
  );
  const selectedPolicy =
    data.planPolicies.find(
      (policy) => policy.planVersionId === selectedPlanVersionId,
    ) ?? null;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <Heading level={6}>{t("features.detail.policy.configuredTitle")}</Heading>
            <Text size="xs" tone="muted" className="mt-1">
              {t("features.detail.policy.configuredSub")}
            </Text>
          </div>
          <Badge tone="neutral">
            {t("features.detail.policy.configuredVersions", {
              count: data.planPolicies.length,
            })}
          </Badge>
        </div>
        <div className="mt-5">
          {data.planPolicies.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>{t("features.planVersion")}</TableHeaderCell>
                  <TableHeaderCell>{t("features.access")}</TableHeaderCell>
                  <TableHeaderCell>{t("features.detail.policy.limitCol")}</TableHeaderCell>
                  <TableHeaderCell>{t("features.detail.policy.pricingCol")}</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.planPolicies.map((policy) => (
                  <TableRow key={policy.planVersionId}>
                    <TableCell>
                      <Text size="sm" weight="semibold">
                        {policy.planName} · v{policy.versionNumber}
                      </Text>
                      <Code className="mt-1 inline-block">{policy.planCode}</Code>
                    </TableCell>
                    <TableCell>
                      <Badge
                        tone={
                          policy.isIncluded === false
                            ? "danger"
                            : policy.isIncluded === true
                              ? "success"
                              : "neutral"
                        }
                      >
                        {policy.isIncluded === null
                          ? t("features.detail.policy.inherited")
                          : policy.isIncluded
                            ? t("features.allowed")
                            : t("features.denied")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {policy.limits.length > 0
                        ? t("features.detail.policy.limitCell", {
                            value: policy.limits[0].limitValue ?? t("features.unlimited"),
                            period: policy.limits[0].period,
                          })
                        : t("features.unlimited")}
                    </TableCell>
                    <TableCell>
                      {policy.pricingRules.length > 0
                        ? t("features.detail.policy.pricingCell", {
                            credits: policy.pricingRules[0].creditCostPerUnit ?? "0",
                            metric: policy.pricingRules[0].metric,
                          })
                        : t("features.free")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title={t("features.detail.policy.noExplicitPolicies")}
              description={t("features.detail.policy.noExplicitPoliciesDesc")}
            />
          )}
        </div>
      </Card>

      <Card>
        <Heading level={6}>{t("features.detail.policy.editorTitle")}</Heading>
        <Text size="xs" tone="muted" className="mt-1">
          {t("features.detail.policy.editorSub")}
        </Text>
        <div className="mt-6">
          <PolicyEditor
            key={selectedPlanVersionId}
            data={data}
            selectedPolicy={selectedPolicy}
            selectedPlanVersionId={selectedPlanVersionId}
            onPlanVersionChange={setSelectedPlanVersionId}
          />
        </div>
      </Card>
    </div>
  );
}

function DependenciesTab({ data }: { data: FeatureDetailData }) {
  const { t, locale } = useI18n();
  const action = addFeatureDependency.bind(null, data.feature.id);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [dependsOnFeatureId, setDependsOnFeatureId] = useState("");
  const [dependencyMode, setDependencyMode] = useState("hard");
  const [conditionJson, setConditionJson] = useState("{}");

  return (
    <div className="space-y-6">
      <Card>
        <Heading level={6}>{t("features.detail.dependencies.addUpdateTitle")}</Heading>
        <Text size="xs" tone="muted" className="mt-1">
          {t("features.detail.dependencies.addUpdateSub")}
        </Text>
        <form action={formAction} className="mt-5 space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <input
            type="hidden"
            name="dependsOnFeatureId"
            value={dependsOnFeatureId}
          />
          <input type="hidden" name="dependencyMode" value={dependencyMode} />
          <ActionMessage state={state} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("features.detail.dependencies.dependencyLabel")} required>
              <Select
                value={dependsOnFeatureId}
                onValueChange={setDependsOnFeatureId}
                placeholder={t("features.detail.dependencies.chooseFeature")}
                options={data.availableFeatures.map((feature) => ({
                  value: feature.id,
                  label: `${feature.name} · ${feature.code}`,
                  disabled: !feature.isActive,
                }))}
              />
            </Field>
            <Field label={t("features.detail.dependencies.modeLabel")}>
              <Select
                value={dependencyMode}
                onValueChange={setDependencyMode}
                options={[
                  { value: "hard", label: t("features.detail.dependencies.hardRequirement") },
                  { value: "soft", label: t("features.detail.dependencies.softRecommendation") },
                ]}
              />
            </Field>
          </div>
          <Field label={t("features.detail.dependencies.conditionConfig")}>
            <Textarea
              name="conditionJson"
              value={conditionJson}
              onChange={(event) => setConditionJson(event.target.value)}
              rows={5}
              className="font-mono text-xs"
            />
          </Field>
          <div className="flex justify-end">
            <Button
              type="submit"
              loading={pending}
              disabled={!dependsOnFeatureId}
              leadingIcon={<Plus className="size-4" />}
            >
              {t("features.detail.dependencies.saveDependency")}
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <Heading level={6}>{t("features.detail.dependencies.dependsOnTitle")}</Heading>
          <div className="mt-5">
            {data.dependencies.length > 0 ? (
              <div className="space-y-3">
                {data.dependencies.map((dependency) => (
                  <div
                    key={dependency.id}
                    className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-neutral-200 p-4"
                  >
                    <div>
                      <Text size="sm" weight="semibold">
                        {dependency.dependsOnFeatureName}
                      </Text>
                      <div className="mt-1 flex items-center gap-2">
                        <Code>{dependency.dependsOnFeatureCode}</Code>
                        <Badge
                          tone={dependency.isHardDependency ? "warning" : "neutral"}
                          size="sm"
                        >
                          {dependency.isHardDependency
                            ? t("features.detail.dependencies.hard")
                            : t("features.detail.dependencies.soft")}
                        </Badge>
                      </div>
                    </div>
                    <form
                      action={removeFeatureDependency.bind(
                        null,
                        data.feature.id,
                        dependency.id,
                      )}
                    >
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        leadingIcon={<Trash2 className="size-3.5" />}
                      >
                        {t("features.detail.dependencies.remove")}
                      </Button>
                    </form>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title={t("features.detail.dependencies.noOutbound")}
                description={t("features.detail.dependencies.noOutboundDesc")}
              />
            )}
          </div>
        </Card>

        <Card>
          <Heading level={6}>{t("features.detail.dependencies.requiredByTitle")}</Heading>
          <div className="mt-5">
            {data.requiredBy.length > 0 ? (
              <div className="space-y-3">
                {data.requiredBy.map((dependency) => (
                  <LocalizedLink
                    key={dependency.id}
                    href={`/features/${dependency.featureId}`}
                    className="block rounded-[var(--radius-md)] border border-neutral-200 p-4 outline-none transition-colors hover:border-primary-200 hover:bg-primary-50/40 focus-visible:ring-[3px] focus-visible:ring-primary-200"
                  >
                    <Text size="sm" weight="semibold">
                      {dependency.featureName}
                    </Text>
                    <Code className="mt-1 inline-block">{dependency.featureCode}</Code>
                  </LocalizedLink>
                ))}
              </div>
            ) : (
              <EmptyState
                title={t("features.detail.dependencies.noInbound")}
                description={t("features.detail.dependencies.noInboundDesc")}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function UsageTab({ data }: { data: FeatureDetailData }) {
  const { t } = useI18n();
  const points = data.usage.daily.map((row) => Number(row.quantity));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label={t("features.detail.usage.quantity")}
          value={<NumericText size="xl">{formatNumber(data.usage.quantity30d)}</NumericText>}
          helper={t("features.detail.usage.quantityHelper")}
          icon={<Gauge className="size-4" />}
        />
        <SummaryCard
          label={t("features.detail.usage.events")}
          value={<NumericText size="xl">{formatNumber(data.usage.events30d)}</NumericText>}
          helper={t("features.detail.usage.eventsHelper")}
          icon={<Activity className="size-4" />}
        />
        <SummaryCard
          label={t("features.detail.usage.activeUsers")}
          value={<NumericText size="xl">{formatNumber(data.usage.activeUsers30d)}</NumericText>}
          helper={t("features.detail.usage.activeUsersHelper")}
          icon={<Users className="size-4" />}
        />
        <SummaryCard
          label={t("features.detail.usage.creditConsumption")}
          value={<NumericText size="xl">{formatNumber(data.usage.credits30d)}</NumericText>}
          helper={t("features.detail.usage.moneyUnitsRecorded", {
            count: formatNumber(data.usage.money30d),
          })}
          icon={<Coins className="size-4" />}
        />
      </div>

      <ChartContainer>
        <ChartHeader
          title={t("features.detail.usage.trendTitle")}
          subtitle={t("features.detail.usage.trendSubtitle")}
          action={
            <Badge tone="neutral">
              {data.feature.unitName || t("features.detail.usage.units")}
            </Badge>
          }
        />
        {points.length > 0 ? (
          <div className="flex min-h-48 items-center justify-center overflow-x-auto">
            <Sparkline points={points} width={720} height={160} />
          </div>
        ) : (
          <ChartEmptyState height={192} />
        )}
      </ChartContainer>

      <Card>
        <Heading level={6}>{t("features.detail.usage.ledgerTitle")}</Heading>
        <div className="mt-5">
          {data.usage.daily.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>{t("features.detail.usage.date")}</TableHeaderCell>
                  <TableHeaderCell className="text-end">
                    {t("features.detail.usage.quantityCol")}
                  </TableHeaderCell>
                  <TableHeaderCell className="text-end">
                    {t("features.detail.usage.creditsCol")}
                  </TableHeaderCell>
                  <TableHeaderCell className="text-end">
                    {t("features.detail.usage.moneyCol")}
                  </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.usage.daily.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell className="text-end">
                      <NumericText size="sm">{formatNumber(row.quantity)}</NumericText>
                    </TableCell>
                    <TableCell className="text-end">
                      {formatNumber(row.credits)}
                    </TableCell>
                    <TableCell className="text-end">
                      {formatNumber(row.money)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title={t("features.detail.usage.noAggregates")}
              description={t("features.detail.usage.noAggregatesDesc")}
            />
          )}
        </div>
      </Card>
    </div>
  );
}

function SettingsTab({ data }: { data: FeatureDetailData }) {
  const { t, locale } = useI18n();
  const action = updateFeature.bind(null, data.feature.id);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [name, setName] = useState(data.feature.name);
  const [code, setCode] = useState(data.feature.code);
  const [description, setDescription] = useState(data.feature.description ?? "");
  const [kind, setKind] = useState<FeatureKind>(data.feature.kind);
  const [unitName, setUnitName] = useState(data.feature.unitName ?? "");
  const [isActive, setIsActive] = useState(data.feature.isActive);
  const [defaultAccess, setDefaultAccess] = useState(
    readDefaultAccess(data.feature.metadata) ?? "allow",
  );
  const [metadataJson, setMetadataJson] = useState(
    JSON.stringify(data.feature.metadata ?? {}, null, 2),
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="defaultAccess" value={defaultAccess} />
      {isActive && <input type="hidden" name="isActive" value="on" />}
      <ActionMessage state={state} />
      <Card>
        <Heading level={6}>{t("features.detail.settings.configurationTitle")}</Heading>
        <Text size="xs" tone="muted" className="mt-1">
          {t("features.detail.settings.configurationSub")}
        </Text>
        <div className="mt-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("features.name")} required>
              <TextInput
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field label={t("features.stableCode")} required>
              <TextInput
                name="code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
            </Field>
          </div>
          <Field label={t("features.description")}>
            <Textarea
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label={t("features.capabilityType")}>
              <Select
                value={kind}
                onValueChange={(value) => setKind(value as FeatureKind)}
                options={[
                  { value: "boolean", label: t("features.kind.boolean") },
                  { value: "metered", label: t("features.kind.metered") },
                  { value: "quota", label: t("features.kind.quota") },
                  { value: "package", label: t("features.kind.package") },
                ]}
              />
            </Field>
            <Field label={t("features.unitName")}>
              <TextInput
                name="unitName"
                value={unitName}
                onChange={(event) => setUnitName(event.target.value)}
              />
            </Field>
            <Field label={t("features.defaultAccess")}>
              <Select
                value={defaultAccess}
                onValueChange={(value) =>
                  setDefaultAccess(value as "allow" | "deny")
                }
                options={[
                  { value: "allow", label: t("features.allowByDefault") },
                  { value: "deny", label: t("features.denyByDefault") },
                ]}
              />
            </Field>
          </div>
          <Card padding="sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Text size="sm" weight="semibold">
                  {t("features.globalAvailability")}
                </Text>
                <Text size="xs" tone="muted" className="mt-1">
                  {t("features.detail.settings.globalAvailabilityHint")}
                </Text>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </Card>
          <Field label={t("features.extensibleMetadata")}>
            <Textarea
              name="metadataJson"
              value={metadataJson}
              onChange={(event) => setMetadataJson(event.target.value)}
              rows={12}
              className="font-mono text-xs"
            />
          </Field>
          <div className="flex justify-end">
            <Button
              type="submit"
              loading={pending}
              leadingIcon={<Save className="size-4" />}
            >
              {t("features.detail.settings.saveFeature")}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <Heading level={6}>{t("features.detail.settings.rawMetadata")}</Heading>
        <div className="mt-4">
          <CodeBlock code={metadataJson} language="json" />
        </div>
      </Card>
    </form>
  );
}

export function FeatureDetail({ data }: { data: FeatureDetailData }) {
  const { t } = useI18n();
  const kindName = kindLabels(t);

  return (
    <div className="space-y-6 p-6 max-sm:p-4">
      <div>
        <Breadcrumb
          items={[
            { label: t("features.catalog"), href: "/features" },
            { label: data.feature.name },
          ]}
        />
        <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Heading level={2}>{data.feature.name}</Heading>
              <Badge tone={getFeatureKindTone(data.feature.kind)}>
                {kindName[data.feature.kind]}
              </Badge>
              <Badge tone={data.feature.isActive ? "success" : "neutral"}>
                {data.feature.isActive
                  ? t("features.active")
                  : t("features.inactive")}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Code>{data.feature.code}</Code>
              <Text size="xs" tone="muted">
                {data.feature.unitName
                  ? t("features.detail.measuredIn", { unit: data.feature.unitName })
                  : t("features.detail.nonMetered")}
              </Text>
            </div>
          </div>
          <LocalizedLink
            href="/features"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            <ArrowLeft className="size-4" />
            {t("features.backToCatalog")}
          </LocalizedLink>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <div className="overflow-x-auto">
          <TabsList className="min-w-max">
            <TabsTrigger value="overview">
              <Boxes className="me-2 inline size-3.5" />
              {t("features.detail.tabs.overview")}
            </TabsTrigger>
            <TabsTrigger value="policies">
              <ShieldCheck className="me-2 inline size-3.5" />
              {t("features.detail.tabs.policies")}
            </TabsTrigger>
            <TabsTrigger value="dependencies">
              <Network className="me-2 inline size-3.5" />
              {t("features.dependencies")}
            </TabsTrigger>
            <TabsTrigger value="usage">
              <Activity className="me-2 inline size-3.5" />
              {t("features.detail.tabs.usage")}
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings2 className="me-2 inline size-3.5" />
              {t("features.detail.tabs.settings")}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview">
          <OverviewTab data={data} />
        </TabsContent>
        <TabsContent value="policies">
          <PoliciesTab data={data} />
        </TabsContent>
        <TabsContent value="dependencies">
          <DependenciesTab data={data} />
        </TabsContent>
        <TabsContent value="usage">
          <UsageTab data={data} />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsTab data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
