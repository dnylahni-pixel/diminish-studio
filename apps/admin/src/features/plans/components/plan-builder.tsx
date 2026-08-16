"use client";

import { useActionState, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  Boxes,
  Check,
  CircleDollarSign,
  Coins,
  CopyPlus,
  FilePlus2,
  Layers3,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/actions";
import { Badge, Card, StatusIndicator } from "@/components/ui/data-display";
import { Alert, EmptyState, Progress } from "@/components/ui/feedback";
import { Switch } from "@/components/ui/form-controls";
import { Field, Textarea, TextInput } from "@/components/ui/inputs";
import { Breadcrumb, Stepper } from "@/components/ui/navigation";
import { Select } from "@/components/ui/select-combobox";
import { ChoiceCard } from "@/components/ui/selection";
import { Code, Heading, NumericText, Text } from "@/components/ui/typography";
import { LocalizedLink, useI18n } from "@/i18n/client";
import type { MessageKey } from "@/i18n/translate";
import { createPlan } from "../actions";
import type {
  CreatePlanActionState,
  PlanCreationData,
  PlanCreationMode,
  PlanStatus,
  PriceType,
} from "../types";
import { enumLabel } from "./plan-formatters";

const stepKeys = ["foundation", "pricing", "entitlements", "credits", "review"];
const initialState: CreatePlanActionState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

function slugifyPlanCode(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function FieldError({
  state,
  name,
}: {
  state: CreatePlanActionState;
  name: string;
}) {
  const message = state.fieldErrors[name]?.[0];
  return message ? (
    <Text size="xs" className="mt-1 text-danger-600">
      {message}
    </Text>
  ) : null;
}

function SectionHeading({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary-50 text-primary-700">
        {icon}
      </div>
      <div>
        <Heading level={5}>{title}</Heading>
        <Text size="sm" tone="muted" className="mt-1">
          {description}
        </Text>
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 rounded-[var(--radius-md)] border border-neutral-200 p-4">
      <div>
        <Text size="sm" weight="semibold">
          {title}
        </Text>
        <Text size="xs" tone="muted" className="mt-1">
          {description}
        </Text>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function PlanBuilder({ data }: { data: PlanCreationData }) {
  const { t } = useI18n();
  const steps = stepKeys.map(
    (key) => t(`plans.builder.steps.${key}` as MessageKey),
  );
  const [state, formAction, pending] = useActionState(createPlan, initialState);
  const [step, setStep] = useState(0);
  const [creationMode, setCreationMode] = useState<PlanCreationMode>("scratch");
  const [sourcePlanId, setSourcePlanId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Extract<PlanStatus, "draft" | "active">>(
    "draft",
  );
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [sortOrder, setSortOrder] = useState(String(data.suggestedSortOrder));
  const [versionTitle, setVersionTitle] = useState(
    t("plans.builder.defaults.versionTitle"),
  );
  const [changeNotes, setChangeNotes] = useState(
    t("plans.builder.defaults.changeNotes"),
  );
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [priceType, setPriceType] = useState<PriceType>("recurring");
  const [amountMajor, setAmountMajor] = useState("0");
  const [currency, setCurrency] = useState("USD");
  const [billingInterval, setBillingInterval] = useState("month");
  const [billingIntervalCount, setBillingIntervalCount] = useState("1");
  const [trialDays, setTrialDays] = useState("0");
  const [featureIds, setFeatureIds] = useState<string[]>([]);
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [monthlyCreditGrant, setMonthlyCreditGrant] = useState("0");
  const [resetPolicy, setResetPolicy] = useState("monthly");
  const [rolloverEnabled, setRolloverEnabled] = useState(false);
  const [rolloverCap, setRolloverCap] = useState("0");
  const [negativeBalanceAllowed, setNegativeBalanceAllowed] = useState(false);
  const [maxNegativeBalance, setMaxNegativeBalance] = useState("0");
  const [localError, setLocalError] = useState("");

  const selectedSource = data.sourcePlans.find((plan) => plan.id === sourcePlanId);
  const selectedFeatures = data.features.filter((feature) =>
    featureIds.includes(feature.id),
  );
  const selectedAddons = data.addons.filter((addon) => addonIds.includes(addon.id));
  const completion = Math.round(((step + 1) / steps.length) * 100);
  const pricePreview = useMemo(() => {
    const parsed = Number(amountMajor);
    if (!Number.isFinite(parsed)) return `${currency} —`;
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: /^[A-Z]{3}$/.test(currency) ? currency : "USD",
      maximumFractionDigits: 2,
    }).format(parsed);
    if (priceType === "recurring") {
      const intervalName = t(
        `plans.formatters.intervals.${billingInterval}` as MessageKey,
      );
      const intervalPart =
        billingIntervalCount === "1"
          ? intervalName
          : `${billingIntervalCount} ${intervalName}`;
      return `${formatted} / ${intervalPart}`;
    }
    return `${formatted} ${t("plans.formatters.oneTime")}`;
  }, [amountMajor, billingInterval, billingIntervalCount, currency, priceType, t]);

  const updateName = (value: string) => {
    setName(value);
    if (!codeTouched) setCode(slugifyPlanCode(value));
  };

  const validateCurrentStep = () => {
    if (step === 0) {
      if (name.trim().length < 2) return t("plans.builder.validation.nameShort");
      if (!/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(code)) {
        return t("plans.builder.validation.codeInvalid");
      }
      if (creationMode === "clone" && !sourcePlanId) {
        return t("plans.builder.validation.sourceRequired");
      }
      if (status === "active" && !effectiveFrom) {
        return t("plans.builder.validation.activeNeedsDate");
      }
    }
    if (step === 1) {
      if (!/^\d+(?:\.\d{1,2})?$/.test(amountMajor)) {
        return t("plans.builder.validation.priceInvalid");
      }
      if (!/^[A-Z]{3}$/.test(currency)) {
        return t("plans.builder.validation.currencyInvalid");
      }
    }
    if (
      step === 3 &&
      rolloverEnabled &&
      Number(rolloverCap) < Number(monthlyCreditGrant)
    ) {
      return t("plans.builder.validation.rolloverCapLow");
    }
    return "";
  };

  const goNext = () => {
    const validationError = validateCurrentStep();
    setLocalError(validationError);
    if (!validationError) {
      setStep((current) => Math.min(steps.length - 1, current + 1));
    }
  };

  return (
    <form action={formAction} className="space-y-6 p-6 max-sm:p-4">
      <input type="hidden" name="creationMode" value={creationMode} />
      <input type="hidden" name="sourcePlanId" value={sourcePlanId} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="visibility" value={visibility} />
      <input type="hidden" name="priceType" value={priceType} />
      <input type="hidden" name="billingInterval" value={billingInterval} />
      <input type="hidden" name="resetPolicy" value={resetPolicy} />
      {rolloverEnabled && <input type="hidden" name="rolloverEnabled" value="on" />}
      {negativeBalanceAllowed && (
        <input type="hidden" name="negativeBalanceAllowed" value="on" />
      )}
      {featureIds.map((featureId) => (
        <input key={featureId} type="hidden" name="featureIds" value={featureId} />
      ))}
      {addonIds.map((addonId) => (
        <input key={addonId} type="hidden" name="addonIds" value={addonId} />
      ))}

      <div>
        <Breadcrumb
          items={[
            { label: t("plans.list.title"), href: "/plans" },
            { label: t("plans.common.createPlan") },
          ]}
        />
        <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Heading level={2}>{t("plans.builder.title")}</Heading>
              <Badge tone="primary">{t("plans.builder.guidedBuilder")}</Badge>
            </div>
            <Text tone="muted" size="sm" className="mt-1 max-w-3xl">
              {t("plans.builder.subtitle")}
            </Text>
          </div>
          <LocalizedLink
            href="/plans"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            <ArrowLeft className="size-4" />
            {t("plans.builder.backToCatalog")}
          </LocalizedLink>
        </div>
      </div>

      <Card padding="sm" className="overflow-x-auto">
        <div className="min-w-[42rem]">
          <Stepper steps={steps} current={step} />
        </div>
      </Card>

      {(state.status === "error" || localError) && (
        <Alert tone="danger" title={t("plans.builder.alertTitle")}>
          {localError || state.message}
        </Alert>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card padding="lg" className="min-w-0">
          <div className={step === 0 ? "space-y-6" : "hidden"}>
            <SectionHeading
              icon={<FilePlus2 className="size-4" />}
              title={t("plans.builder.foundation.title")}
              description={t("plans.builder.foundation.description")}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <ChoiceCard
                title={t("plans.builder.foundation.scratchTitle")}
                description={t("plans.builder.foundation.scratchDescription")}
                icon={<Sparkles className="size-4" />}
                selected={creationMode === "scratch"}
                onClick={() => {
                  setCreationMode("scratch");
                  setSourcePlanId("");
                }}
              />
              <ChoiceCard
                title={t("plans.builder.foundation.cloneTitle")}
                description={t("plans.builder.foundation.cloneDescription")}
                icon={<CopyPlus className="size-4" />}
                selected={creationMode === "clone"}
                disabled={data.sourcePlans.length === 0}
                onClick={() => setCreationMode("clone")}
              />
            </div>

            {creationMode === "clone" && (
              <Field
                label={t("plans.builder.foundation.sourcePlanLabel")}
                required
                state={state.fieldErrors.sourcePlanId ? "error" : "default"}
              >
                <Select
                  value={sourcePlanId}
                  onValueChange={setSourcePlanId}
                  placeholder={t("plans.builder.foundation.sourcePlanPlaceholder")}
                  options={data.sourcePlans.map((plan) => ({
                    value: plan.id,
                    label: `${plan.name} · ${plan.code} · ${
                      plan.versionNumber
                        ? `v${plan.versionNumber}`
                        : t("plans.builder.foundation.noVersion")
                    }`,
                    disabled: plan.versionNumber === null,
                  }))}
                />
                <FieldError state={state} name="sourcePlanId" />
              </Field>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label={t("plans.builder.nameLabel")}
                htmlFor="name"
                required
                state={state.fieldErrors.name ? "error" : "default"}
              >
                <TextInput
                  id="name"
                  name="name"
                  value={name}
                  onChange={(event) => updateName(event.target.value)}
                  placeholder={t("plans.builder.namePlaceholder")}
                  state={state.fieldErrors.name ? "error" : "default"}
                />
                <FieldError state={state} name="name" />
              </Field>
              <Field
                label={t("plans.builder.codeLabel")}
                htmlFor="code"
                required
                helper={t("plans.builder.codeHelper")}
                state={state.fieldErrors.code ? "error" : "default"}
              >
                <TextInput
                  id="code"
                  name="code"
                  value={code}
                  onChange={(event) => {
                    setCodeTouched(true);
                    setCode(slugifyPlanCode(event.target.value));
                  }}
                  placeholder={t("plans.builder.codePlaceholder")}
                  state={state.fieldErrors.code ? "error" : "default"}
                />
                <FieldError state={state} name="code" />
              </Field>
            </div>

            <Field
              label={t("plans.builder.descriptionLabel")}
              htmlFor="description"
              optional
              helper={t("plans.builder.descriptionHelper", {
                count: description.length,
              })}
              state={state.fieldErrors.description ? "error" : "default"}
            >
              <Textarea
                id="description"
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={500}
                placeholder={t("plans.builder.descriptionPlaceholder")}
                state={state.fieldErrors.description ? "error" : "default"}
              />
              <FieldError state={state} name="description" />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <ChoiceCard
                title={t("plans.enums.draft")}
                description={t("plans.builder.foundation.draftDescription")}
                selected={status === "draft"}
                onClick={() => setStatus("draft")}
              />
              <ChoiceCard
                title={t("plans.enums.active")}
                description={t("plans.builder.foundation.activeDescription")}
                selected={status === "active"}
                onClick={() => setStatus("active")}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t("plans.builder.visibilityLabel")}>
                <Select
                  value={visibility}
                  onValueChange={(value) =>
                    setVisibility(value as "private" | "public")
                  }
                  options={[
                    { value: "private", label: t("plans.builder.privateCatalog") },
                    { value: "public", label: t("plans.builder.publicCatalog") },
                  ]}
                />
              </Field>
              <Field label={t("plans.builder.catalogOrderLabel")} htmlFor="sortOrder">
                <TextInput
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  min={0}
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                />
              </Field>
              <Field label={t("plans.builder.versionTitleLabel")} htmlFor="versionTitle">
                <TextInput
                  id="versionTitle"
                  name="versionTitle"
                  value={versionTitle}
                  onChange={(event) => setVersionTitle(event.target.value)}
                />
              </Field>
              <Field
                label={t("plans.builder.effectiveFromLabel")}
                htmlFor="effectiveFrom"
                optional={status === "draft"}
                required={status === "active"}
                state={state.fieldErrors.effectiveFrom ? "error" : "default"}
              >
                <TextInput
                  id="effectiveFrom"
                  name="effectiveFrom"
                  type="datetime-local"
                  value={effectiveFrom}
                  onChange={(event) => setEffectiveFrom(event.target.value)}
                  state={state.fieldErrors.effectiveFrom ? "error" : "default"}
                />
                <FieldError state={state} name="effectiveFrom" />
              </Field>
            </div>

            <Field label={t("plans.builder.changeNotesLabel")} htmlFor="changeNotes">
              <Textarea
                id="changeNotes"
                name="changeNotes"
                rows={3}
                value={changeNotes}
                onChange={(event) => setChangeNotes(event.target.value)}
              />
            </Field>
          </div>

          <div className={step === 1 ? "space-y-6" : "hidden"}>
            <SectionHeading
              icon={<BadgeDollarSign className="size-4" />}
              title={t("plans.builder.commercial.title")}
              description={t("plans.builder.commercial.description")}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <ChoiceCard
                title={t("plans.builder.commercial.recurringTitle")}
                description={t("plans.builder.commercial.recurringDescription")}
                selected={priceType === "recurring"}
                onClick={() => setPriceType("recurring")}
              />
              <ChoiceCard
                title={t("plans.builder.commercial.oneTimeTitle")}
                description={t("plans.builder.commercial.oneTimeDescription")}
                selected={priceType === "one_time"}
                onClick={() => setPriceType("one_time")}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field
                label={t("plans.builder.priceLabel")}
                htmlFor="amountMajor"
                required
                helper={t("plans.builder.priceHelper")}
                state={state.fieldErrors.amountMajor ? "error" : "default"}
                className="sm:col-span-2"
              >
                <TextInput
                  id="amountMajor"
                  name="amountMajor"
                  inputMode="decimal"
                  value={amountMajor}
                  onChange={(event) => setAmountMajor(event.target.value)}
                  leadingIcon={<CircleDollarSign className="size-4" />}
                  state={state.fieldErrors.amountMajor ? "error" : "default"}
                />
                <FieldError state={state} name="amountMajor" />
              </Field>
              <Field
                label={t("plans.builder.currencyLabel")}
                htmlFor="currency"
                required
                state={state.fieldErrors.currency ? "error" : "default"}
              >
                <TextInput
                  id="currency"
                  name="currency"
                  value={currency}
                  maxLength={3}
                  onChange={(event) => setCurrency(event.target.value.toUpperCase())}
                  state={state.fieldErrors.currency ? "error" : "default"}
                />
                <FieldError state={state} name="currency" />
              </Field>
              <Field label={t("plans.builder.trialDaysLabel")} htmlFor="trialDays">
                <TextInput
                  id="trialDays"
                  name="trialDays"
                  type="number"
                  min={0}
                  max={3650}
                  value={trialDays}
                  onChange={(event) => setTrialDays(event.target.value)}
                />
              </Field>
            </div>
            {priceType === "recurring" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("plans.builder.billingIntervalLabel")}>
                  <Select
                    value={billingInterval}
                    onValueChange={setBillingInterval}
                    options={[
                      { value: "day", label: t("plans.enums.day") },
                      { value: "week", label: t("plans.enums.week") },
                      { value: "month", label: t("plans.enums.month") },
                      { value: "year", label: t("plans.enums.year") },
                    ]}
                  />
                </Field>
                <Field
                  label={t("plans.builder.intervalCountLabel")}
                  htmlFor="billingIntervalCount"
                >
                  <TextInput
                    id="billingIntervalCount"
                    name="billingIntervalCount"
                    type="number"
                    min={1}
                    max={365}
                    value={billingIntervalCount}
                    onChange={(event) => setBillingIntervalCount(event.target.value)}
                  />
                </Field>
              </div>
            ) : (
              <input type="hidden" name="billingIntervalCount" value="1" />
            )}
            <Alert tone="info" title={t("plans.builder.commercial.versionSafeTitle")}>
              {t("plans.builder.commercial.versionSafeBody")}
            </Alert>
          </div>

          <div className={step === 2 ? "space-y-6" : "hidden"}>
            <SectionHeading
              icon={<Boxes className="size-4" />}
              title={t("plans.builder.entitlements.title")}
              description={t("plans.builder.entitlements.description")}
            />
            {creationMode === "clone" && selectedSource && (
              <Alert
                tone="info"
                title={t("plans.builder.entitlements.cloningTitle", {
                  name: selectedSource.name,
                })}
              >
                {t("plans.builder.entitlements.cloningBody")}
              </Alert>
            )}
            <div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Heading level={6}>
                    {t("plans.builder.entitlements.includedFeaturesTitle")}
                  </Heading>
                  <Text size="xs" tone="muted" className="mt-1">
                    {t("plans.builder.entitlements.selectedFeaturesCount", {
                      count: featureIds.length,
                    })}
                  </Text>
                </div>
                {data.features.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFeatureIds(
                        featureIds.length === data.features.length
                          ? []
                          : data.features.map((feature) => feature.id),
                      )
                    }
                  >
                    {featureIds.length === data.features.length
                      ? t("plans.builder.entitlements.clearAll")
                      : t("plans.builder.entitlements.selectAll")}
                  </Button>
                )}
              </div>
              {data.features.length > 0 ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {data.features.map((feature) => {
                    const selected = featureIds.includes(feature.id);
                    return (
                      <ChoiceCard
                        key={feature.id}
                        title={feature.name}
                        description={`${feature.code} · ${feature.kind}${
                          feature.unitName ? ` · ${feature.unitName}` : ""
                        }${feature.description ? ` — ${feature.description}` : ""}`}
                        selected={selected}
                        indicator="checkbox"
                        onClick={() =>
                          setFeatureIds((current) =>
                            selected
                              ? current.filter((id) => id !== feature.id)
                              : [...current, feature.id],
                          )
                        }
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4">
                  <EmptyState
                    icon={<Layers3 className="size-5" />}
                    title={t("plans.builder.entitlements.noFeaturesTitle")}
                    description={t("plans.builder.entitlements.noFeaturesDescription")}
                  />
                </div>
              )}
            </div>
            <div className="border-t border-neutral-100 pt-6">
              <Heading level={6}>
                {t("plans.builder.entitlements.availableAddonsTitle")}
              </Heading>
              <Text size="xs" tone="muted" className="mt-1">
                {t("plans.builder.entitlements.availableAddonsHelper")}
              </Text>
              {data.addons.length > 0 ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {data.addons.map((addon) => {
                    const selected = addonIds.includes(addon.id);
                    return (
                      <ChoiceCard
                        key={addon.id}
                        title={addon.name}
                        description={`${addon.code} · ${addon.scope}${
                          addon.description ? ` — ${addon.description}` : ""
                        }`}
                        selected={selected}
                        indicator="checkbox"
                        onClick={() =>
                          setAddonIds((current) =>
                            selected
                              ? current.filter((id) => id !== addon.id)
                              : [...current, addon.id],
                          )
                        }
                      />
                    );
                  })}
                </div>
              ) : (
                <Text size="sm" tone="subtle" className="mt-4">
                  {t("plans.builder.entitlements.noActiveAddons")}
                </Text>
              )}
            </div>
          </div>

          <div className={step === 3 ? "space-y-6" : "hidden"}>
            <SectionHeading
              icon={<Coins className="size-4" />}
              title={t("plans.builder.credits.title")}
              description={t("plans.builder.credits.description")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t("plans.builder.credits.creditsPerCycleLabel")}
                htmlFor="monthlyCreditGrant"
                helper={t("plans.builder.credits.creditsPerCycleHelper")}
              >
                <TextInput
                  id="monthlyCreditGrant"
                  name="monthlyCreditGrant"
                  type="number"
                  min={0}
                  value={monthlyCreditGrant}
                  onChange={(event) => setMonthlyCreditGrant(event.target.value)}
                />
              </Field>
              <Field label={t("plans.builder.credits.resetPolicyLabel")}>
                <Select
                  value={resetPolicy}
                  onValueChange={setResetPolicy}
                  options={[
                    { value: "none", label: t("plans.enums.neverReset") },
                    { value: "daily", label: t("plans.enums.daily") },
                    { value: "weekly", label: t("plans.enums.weekly") },
                    { value: "monthly", label: t("plans.enums.monthly") },
                  ]}
                />
              </Field>
            </div>
            <ToggleRow
              title={t("plans.builder.credits.rolloverTitle")}
              description={t("plans.builder.credits.rolloverDescription")}
              checked={rolloverEnabled}
              onCheckedChange={setRolloverEnabled}
            />
            {rolloverEnabled ? (
              <Field
                label={t("plans.builder.credits.rolloverCapLabel")}
                htmlFor="rolloverCap"
                state={state.fieldErrors.rolloverCap ? "error" : "default"}
              >
                <TextInput
                  id="rolloverCap"
                  name="rolloverCap"
                  type="number"
                  min={0}
                  value={rolloverCap}
                  onChange={(event) => setRolloverCap(event.target.value)}
                  state={state.fieldErrors.rolloverCap ? "error" : "default"}
                />
                <FieldError state={state} name="rolloverCap" />
              </Field>
            ) : (
              <input type="hidden" name="rolloverCap" value="0" />
            )}
            <ToggleRow
              title={t("plans.builder.credits.negativeTitle")}
              description={t("plans.builder.credits.negativeDescription")}
              checked={negativeBalanceAllowed}
              onCheckedChange={setNegativeBalanceAllowed}
            />
            {negativeBalanceAllowed ? (
              <Field
                label={t("plans.builder.credits.maxNegativeLabel")}
                htmlFor="maxNegativeBalance"
                state={state.fieldErrors.maxNegativeBalance ? "error" : "default"}
              >
                <TextInput
                  id="maxNegativeBalance"
                  name="maxNegativeBalance"
                  type="number"
                  min={1}
                  value={maxNegativeBalance}
                  onChange={(event) => setMaxNegativeBalance(event.target.value)}
                  state={
                    state.fieldErrors.maxNegativeBalance ? "error" : "default"
                  }
                />
                <FieldError state={state} name="maxNegativeBalance" />
              </Field>
            ) : (
              <input type="hidden" name="maxNegativeBalance" value="0" />
            )}
            <Alert tone="warning" title={t("plans.builder.credits.policyTitle")}>
              {t("plans.builder.credits.policyBody")}
            </Alert>
          </div>

          <div className={step === 4 ? "space-y-6" : "hidden"}>
            <SectionHeading
              icon={<ShieldCheck className="size-4" />}
              title={t("plans.builder.governance.title")}
              description={t("plans.builder.governance.description")}
            />
            <Alert
              tone={status === "active" ? "warning" : "info"}
              title={
                status === "active"
                  ? t("plans.builder.governance.publishedTitle")
                  : t("plans.builder.governance.draftTitle")
              }
            >
              {status === "active"
                ? t("plans.builder.governance.publishedBody")
                : t("plans.builder.governance.draftBody")}
            </Alert>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                [
                  t("plans.builder.review.identity"),
                  `${name || t("plans.builder.review.unnamed")} · ${
                    code || t("plans.builder.review.noCode")
                  }`,
                ],
                [
                  t("plans.builder.review.lifecycle"),
                  `${enumLabel(t, status)} · ${enumLabel(t, visibility)}`,
                ],
                [
                  t("plans.builder.review.version"),
                  `v1 · ${
                    status === "active"
                      ? t("plans.enums.published")
                      : t("plans.enums.draft")
                  }`,
                ],
                [t("plans.builder.review.defaultPrice"), pricePreview],
                [
                  t("plans.builder.review.entitlements"),
                  creationMode === "clone"
                    ? t("plans.builder.review.cloneEntitlements", {
                        name: selectedSource?.name ?? t("plans.builder.review.source"),
                        count: selectedFeatures.length,
                      })
                    : t("plans.builder.review.selectedFeatures", {
                        count: selectedFeatures.length,
                      }),
                ],
                [
                  t("plans.builder.review.addons"),
                  t("plans.builder.review.selectedAddons", {
                    count: selectedAddons.length,
                  }),
                ],
                [
                  t("plans.builder.review.credits"),
                  t("plans.builder.review.creditsValue", {
                    grant: monthlyCreditGrant || "0",
                    reset: enumLabel(t, resetPolicy),
                  }),
                ],
                [
                  t("plans.builder.review.riskPosture"),
                  negativeBalanceAllowed
                    ? t("plans.builder.review.debtAllowed", {
                        value: maxNegativeBalance,
                      })
                    : t("plans.builder.review.negativeBlocked"),
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[var(--radius-md)] border border-neutral-200 bg-neutral-50 p-4"
                >
                  <Text size="xs" tone="muted" weight="semibold">
                    {label}
                  </Text>
                  <Text size="sm" weight="semibold" className="mt-1">
                    {value}
                  </Text>
                </div>
              ))}
            </div>
            <div className="rounded-[var(--radius-lg)] border border-success-200 bg-success-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success-100 text-success-700">
                  <Check className="size-4" />
                </div>
                <div>
                  <Text size="sm" weight="semibold" className="text-success-900">
                    {t("plans.builder.governance.atomicTitle")}
                  </Text>
                  <Text size="xs" className="mt-1 text-success-800">
                    {t("plans.builder.governance.atomicBody")}
                  </Text>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse justify-between gap-3 border-t border-neutral-100 pt-5 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              disabled={step === 0 || pending}
              leadingIcon={<ArrowLeft className="size-4" />}
              onClick={() => {
                setLocalError("");
                setStep((current) => Math.max(0, current - 1));
              }}
            >
              {t("common.previous")}
            </Button>
            {step < steps.length - 1 ? (
              <Button
                type="button"
                trailingIcon={<ArrowRight className="size-4" />}
                onClick={goNext}
              >
                {t("plans.builder.continue")}
              </Button>
            ) : (
              <Button
                type="submit"
                loading={pending}
                leadingIcon={<Rocket className="size-4" />}
              >
                {status === "active"
                  ? t("plans.builder.createPublishPlan")
                  : t("plans.builder.createDraftPlan")}
              </Button>
            )}
          </div>
        </Card>

        <div className="space-y-4 xl:sticky xl:top-6">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <Text size="xs" tone="muted" weight="semibold">
                  {t("plans.builder.readiness")}
                </Text>
                <NumericText size="lg" className="mt-1 block">
                  {completion}%
                </NumericText>
              </div>
              <Badge tone={step === 4 ? "success" : "info"}>
                {t("plans.builder.stepOf", {
                  current: step + 1,
                  total: steps.length,
                })}
              </Badge>
            </div>
            <div className="mt-4">
              <Progress value={completion} size="sm" />
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Text size="xs" tone="muted" weight="semibold">
                  {t("plans.builder.livePreview")}
                </Text>
                <Heading level={5} className="mt-2 truncate">
                  {name || t("plans.builder.untitledPlan")}
                </Heading>
                <Code className="mt-1 inline-block max-w-full truncate">
                  {code || t("plans.builder.catalogCode")}
                </Code>
              </div>
              <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-neutral-100 text-neutral-500">
                <Layers3 className="size-4" />
              </div>
            </div>
            <Text size="xs" tone="muted" className="mt-4 line-clamp-3">
              {description || t("plans.builder.descriptionPreviewPlaceholder")}
            </Text>
            <div className="mt-5 space-y-3 border-t border-neutral-100 pt-4">
              <div className="flex items-center justify-between gap-3">
                <Text size="xs" tone="muted">
                  {t("plans.builder.preview.lifecycle")}
                </Text>
                <StatusIndicator
                  tone={status === "active" ? "success" : "info"}
                  label={
                    status === "active"
                      ? t("plans.enums.active")
                      : t("plans.enums.draft")
                  }
                  pulse={status === "active"}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Text size="xs" tone="muted">
                  {t("plans.builder.preview.visibility")}
                </Text>
                <Badge tone={visibility === "public" ? "primary" : "neutral"}>
                  {visibility === "public"
                    ? t("plans.common.public")
                    : t("plans.common.private")}
                </Badge>
              </div>
              <div className="flex items-start justify-between gap-3">
                <Text size="xs" tone="muted">
                  {t("plans.builder.preview.price")}
                </Text>
                <Text size="xs" weight="semibold" className="text-end">
                  {pricePreview}
                </Text>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Text size="xs" tone="muted">
                  {t("plans.builder.preview.features")}
                </Text>
                <NumericText size="sm">{selectedFeatures.length}</NumericText>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Text size="xs" tone="muted">
                  {t("plans.builder.preview.addons")}
                </Text>
                <NumericText size="sm">{selectedAddons.length}</NumericText>
              </div>
            </div>
          </Card>

          <Card className="border-primary-100 bg-primary-50/50">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary-700" />
              <div>
                <Text size="xs" weight="semibold" className="text-primary-900">
                  {t("plans.builder.safeguardsTitle")}
                </Text>
                <Text size="xs" className="mt-1 text-primary-800">
                  {t("plans.builder.safeguardsBody")}
                </Text>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
