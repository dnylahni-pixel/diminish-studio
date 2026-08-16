"use client";

import { useState, useTransition } from "react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@appica/ui-react/field";
import { Fieldset, FieldsetLegend } from "@appica/ui-react/fieldset";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@appica/ui-react/tooltip";
import { Input } from "@appica/ui-react/input";
import { Textarea } from "@appica/ui-react/textarea";
import { Switch } from "@appica/ui-react/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@appica/ui-react/select";
import { Radio } from "@appica/ui-react/radio";
import { RadioGroup } from "@appica/ui-react/radio-group";
import { Checkbox } from "@appica/ui-react/checkbox";
import { CheckboxGroup } from "@appica/ui-react/checkbox-group";
import { NumberField } from "@appica/ui-react/number-field";
import { Button } from "@appica/ui-react/button";
import { Spinner } from "@appica/ui-react/spinner";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@appica/ui-react/alert";
import {
  Check,
  CircleX,
  CircleHelp,
  Plus,
  Trash,
} from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { createPlan } from "@/features/plans/actions";
import type {
  AddonWorkspaceItem,
  BillingInterval,
  CreatePlanInput,
  CreditWindow,
  CreditWindowPeriod,
  FeatureWorkspaceItem,
  PlanCrudActionState,
  PlanStatus,
  PriceType,
} from "@/features/plans/types";
import { translate, type PlansKey } from "@/i18n/plans";

const CODE_PATTERN = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

const EXTENSION_TO_MIME: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  flac: "audio/flac",
  m4a: "audio/mp4",
  mp4: "audio/mp4",
  ogg: "audio/ogg",
};

function slugifyCode(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function makeCreditWindow(partial?: Partial<CreditWindow>): CreditWindow {
  return {
    id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    period: "month",
    periodCount: 1,
    creditAmount: 0,
    ...partial,
  };
}

function parseAllowedUploads(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[\s,،]+/)
        .map((entry) => entry.trim().toLowerCase().replace(/^\./, ""))
        .filter(Boolean)
        .map((entry) => EXTENSION_TO_MIME[entry] ?? entry),
    ),
  );
}

interface PlanCreatePanelProps {
  features: FeatureWorkspaceItem[];
  addons: AddonWorkspaceItem[];
  onCancel: () => void;
  onSaved: (message: string, planId?: string) => void;
}

export function PlanCreatePanel({
  features,
  addons,
  onCancel,
  onSaved,
}: PlanCreatePanelProps) {
  const { locale } = useLocale();
  const t = (key: PlansKey) => translate(locale, key);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<PlanStatus>("draft");
  const [isPublic, setIsPublic] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  const [versionTitle, setVersionTitle] = useState("");
  const [changeNotes, setChangeNotes] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [priceType, setPriceType] = useState<PriceType>("recurring");
  const [amountMajor, setAmountMajor] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("month");
  const [billingIntervalCount, setBillingIntervalCount] = useState(1);
  const [trialDays, setTrialDays] = useState(0);
  const [creditWindows, setCreditWindows] = useState<CreditWindow[]>(() => [
    makeCreditWindow({ period: "total" }),
  ]);
  const [rolloverEnabled, setRolloverEnabled] = useState(false);
  const [rolloverCap, setRolloverCap] = useState(0);
  const [negativeBalanceAllowed, setNegativeBalanceAllowed] =
    useState(false);
  const [maxNegativeBalance, setMaxNegativeBalance] = useState(0);
  const [allowedUploads, setAllowedUploads] = useState("");
  const [featureIds, setFeatureIds] = useState<string[]>(() =>
    features.map((feature) => feature.id),
  );
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<
    Record<string, string[] | undefined>
  >({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateName = (value: string) => {
    setName(value);
    if (!codeTouched) setCode(slugifyCode(value));
  };

  const updateCreditWindow = (
    id: string,
    patch: Partial<CreditWindow>,
  ) => {
    setCreditWindows((windows) =>
      windows.map((window) =>
        window.id === id ? { ...window, ...patch } : window,
      ),
    );
  };

  const removeCreditWindow = (id: string) => {
    setCreditWindows((windows) =>
      windows.length > 1 ? windows.filter((window) => window.id !== id) : windows,
    );
  };

  const validateCreate = () => {
    const nextErrors: Record<string, string[]> = {};
    if (name.trim().length < 2) {
      nextErrors.name = [t("errors.nameShort")];
    }
    if (code.trim().length < 2 || !CODE_PATTERN.test(code)) {
      nextErrors.code = [t("errors.codeInvalid")];
    }
    if (!/^\d+(?:\.\d{1,2})?$/.test(amountMajor)) {
      nextErrors.amountMajor = [t("errors.amountInvalid")];
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      nextErrors.currency = [t("errors.currency")];
    }
    if (
      effectiveFrom !== "" &&
      !Number.isFinite(new Date(`${effectiveFrom}:00.000Z`).getTime())
    ) {
      nextErrors.effectiveFrom = [t("errors.dateInvalid")];
    }
    if (status === "active" && !effectiveFrom) {
      nextErrors.effectiveFrom = [t("errors.activeRequiresDate")];
    }
    if (creditWindows.length === 0) {
      nextErrors.creditWindows = [t("errors.creditWindowsRequired")];
    }
    const totalCreditGrant = creditWindows.reduce(
      (sum, window) => sum + window.creditAmount,
      0,
    );
    if (rolloverEnabled && rolloverCap < totalCreditGrant) {
      nextErrors.rolloverCap = [t("errors.rolloverCapLow")];
    }
    if (negativeBalanceAllowed && maxNegativeBalance === 0) {
      nextErrors.maxNegativeBalance = [t("errors.negativeLimit")];
    }
    return nextErrors;
  };

  const handleSave = () => {
    const nextErrors = validateCreate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setServerError(null);
    startTransition(async () => {
      const result: PlanCrudActionState = await createPlan({
        creationMode: "scratch",
        sourcePlanId: "",
        name,
        code,
        description,
        status: status === "active" ? "active" : "draft",
        isPublic,
        sortOrder,
        versionTitle,
        changeNotes,
        effectiveFrom,
        priceType,
        amountMajor,
        currency,
        billingInterval,
        billingIntervalCount,
        trialDays,
        creditWindows,
        rolloverEnabled,
        rolloverCap,
        negativeBalanceAllowed,
        maxNegativeBalance,
        featureIds,
        addonIds,
        allowedUploadMimeTypes: parseAllowedUploads(allowedUploads),
        locale,
      } satisfies CreatePlanInput);
      if (result.status === "success") {
        onSaved(result.message, result.planId);
        return;
      }
      setErrors(result.fieldErrors ?? {});
      setServerError(result.message);
    });
  };

  return (
    <TooltipProvider>
      <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-background">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="text-foreground-intense text-lg font-bold">
              {t("planForm.title")}
            </h2>
            <p className="text-foreground-muted text-sm">
              {t("planForm.description")}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isPending}
          >
            {t("planForm.cancel")}
          </Button>
        </div>

        {serverError ? (
          <div className="p-4 pb-0">
            <Alert variant="error">
              <AlertIcon>
                <CircleX />
              </AlertIcon>
              <AlertTitle>{t("actions.failed")}</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          </div>
        ) : null}

        <div className="flex flex-col gap-5 p-4">
          <Fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
            <FieldsetLegend className="text-foreground-intense text-sm font-semibold">
              {t("planForm.section.general")}
            </FieldsetLegend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="name" invalid={Boolean(errors.name?.[0])}>
                <FieldLabel>{t("planForm.nameLabel")}</FieldLabel>
                <Input
                  name="name"
                  value={name}
                  onChange={(event) => updateName(event.target.value)}
                  placeholder={t("planForm.namePlaceholder")}
                  aria-invalid={errors.name ? true : undefined}
                  className="data-invalid:motion-safe:animate-shake"
                />
                <FieldError>{errors.name?.[0]}</FieldError>
              </Field>

              <Field name="code" invalid={Boolean(errors.code?.[0])}>
                <FieldLabel>{t("planForm.codeLabel")}</FieldLabel>
                <Input
                  name="code"
                  value={code}
                  onChange={(event) => {
                    setCodeTouched(true);
                    setCode(slugifyCode(event.target.value));
                  }}
                  placeholder="pro"
                  aria-invalid={errors.code ? true : undefined}
                  className="font-mono data-invalid:motion-safe:animate-shake"
                />
                <FieldDescription>
                  {t("planForm.codeHelper")}
                </FieldDescription>
                <FieldError>{errors.code?.[0]}</FieldError>
              </Field>
            </div>

            <Field name="description">
              <FieldLabel>{t("planForm.descriptionLabel")}</FieldLabel>
              <Textarea
                name="description"
                rows={3}
                maxLength={1000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t("planForm.descriptionPlaceholder")}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="status">
                <FieldLabel>{t("planForm.statusLabel")}</FieldLabel>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as PlanStatus)}
                >
                  <SelectTrigger aria-label={t("planForm.statusLabel")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">
                      {t("status.draft")}
                    </SelectItem>
                    <SelectItem value="active">
                      {t("status.active")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  {t("planForm.statusHelper")}
                </FieldDescription>
              </Field>

              <Field name="sortOrder">
                <div className="flex items-center gap-1.5">
                  <FieldLabel>{t("planForm.sortOrderLabel")}</FieldLabel>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("planForm.sortOrderLabel")}
                        >
                          <CircleHelp className="size-4" />
                        </Button>
                      }
                    />
                    <TooltipContent side="top">
                      {t("planForm.tooltip.sortOrder")}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <NumberField
                  min={0}
                  step={1}
                  value={sortOrder}
                  onValueChange={(value) => setSortOrder(value ?? 0)}
                />
                <FieldDescription>
                  {t("planForm.sortOrderHelper")}
                </FieldDescription>
              </Field>
            </div>

            <label className="border-border bg-background flex items-center justify-between gap-4 rounded-lg border p-4 text-sm select-none">
              <span className="flex flex-col">
                <span className="text-foreground-intense font-medium">
                  {t("planForm.publicLabel")}
                </span>
                <span className="text-foreground-muted text-xs">
                  {t("planForm.publicHelper")}
                </span>
              </span>
              <Switch
                checked={isPublic}
                onCheckedChange={setIsPublic}
                aria-label={t("planForm.publicLabel")}
              />
            </label>
          </Fieldset>

          <Fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
            <FieldsetLegend className="text-foreground-intense text-sm font-semibold">
              {t("planForm.section.version")}
            </FieldsetLegend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="versionTitle">
                <FieldLabel>{t("planForm.versionTitleLabel")}</FieldLabel>
                <Input
                  name="versionTitle"
                  value={versionTitle}
                  onChange={(event) => setVersionTitle(event.target.value)}
                  placeholder={t("planForm.versionTitlePlaceholder")}
                />
              </Field>
              <Field
                name="effectiveFrom"
                invalid={Boolean(errors.effectiveFrom?.[0])}
              >
                <FieldLabel>{t("planForm.effectiveFromLabel")}</FieldLabel>
                <Input
                  type="datetime-local"
                  name="effectiveFrom"
                  value={effectiveFrom}
                  onChange={(event) => setEffectiveFrom(event.target.value)}
                  aria-invalid={errors.effectiveFrom ? true : undefined}
                  className="data-invalid:motion-safe:animate-shake"
                />
                <FieldDescription>
                  {t("planForm.effectiveFromHelper")}
                </FieldDescription>
                <FieldError>{errors.effectiveFrom?.[0]}</FieldError>
              </Field>
            </div>
            <Field name="changeNotes">
              <FieldLabel>{t("planForm.changeNotesLabel")}</FieldLabel>
              <Textarea
                name="changeNotes"
                rows={2}
                maxLength={500}
                value={changeNotes}
                onChange={(event) => setChangeNotes(event.target.value)}
                placeholder={t("planForm.changeNotesPlaceholder")}
              />
            </Field>
          </Fieldset>

          <Fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
            <FieldsetLegend className="text-foreground-intense text-sm font-semibold">
              {t("planForm.section.pricing")}
            </FieldsetLegend>
            <div className="flex flex-col gap-2">
              <span className="text-foreground-intense text-sm font-medium">
                {t("planForm.priceTypeLabel")}
              </span>
              <RadioGroup
                value={priceType}
                onValueChange={(value) =>
                  setPriceType(value as PriceType)
                }
                orientation="horizontal"
                aria-label={t("planForm.priceTypeLabel")}
                className="gap-4"
              >
                <label className="flex items-center gap-2 text-sm select-none">
                  <Radio value="recurring" />
                  {t("values.recurring")}
                </label>
                <label className="flex items-center gap-2 text-sm select-none">
                  <Radio value="one_time" />
                  {t("values.oneTime")}
                </label>
              </RadioGroup>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                name="amountMajor"
                invalid={Boolean(errors.amountMajor?.[0])}
              >
                <FieldLabel>{t("planForm.amountLabel")}</FieldLabel>
                <NumberField
                  min={0}
                  step={0.01}
                  value={amountMajor === "" ? null : Number(amountMajor)}
                  onValueChange={(value) =>
                    setAmountMajor(value === null ? "" : String(value))
                  }
                  aria-invalid={errors.amountMajor ? true : undefined}
                  className="data-invalid:motion-safe:animate-shake"
                />
                <FieldDescription>
                  {t("planForm.amountHelper")}
                </FieldDescription>
                <FieldError>{errors.amountMajor?.[0]}</FieldError>
              </Field>

              <Field
                name="currency"
                invalid={Boolean(errors.currency?.[0])}
              >
                <FieldLabel>{t("planForm.currencyLabel")}</FieldLabel>
                <Input
                  name="currency"
                  value={currency}
                  onChange={(event) =>
                    setCurrency(
                      event.target.value.toUpperCase().slice(0, 3),
                    )
                  }
                  placeholder="USD"
                  aria-invalid={errors.currency ? true : undefined}
                  className="font-mono data-invalid:motion-safe:animate-shake"
                />
                <FieldDescription>
                  {t("planForm.currencyHelper")}
                </FieldDescription>
                <FieldError>{errors.currency?.[0]}</FieldError>
              </Field>

              {priceType === "recurring" ? (
                <>
                  <Field name="billingInterval">
                    <div className="flex items-center gap-1.5">
                      <FieldLabel>
                        {t("planForm.billingIntervalLabel")}
                      </FieldLabel>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={t(
                                "planForm.billingIntervalLabel",
                              )}
                            >
                              <CircleHelp className="size-4" />
                            </Button>
                          }
                        />
                        <TooltipContent side="top">
                          {t("planForm.tooltip.billingInterval")}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select
                      value={billingInterval}
                      onValueChange={(value) =>
                        setBillingInterval(value as BillingInterval)
                      }
                    >
                      <SelectTrigger
                        aria-label={t("planForm.billingIntervalLabel")}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">
                          {t("interval.day")}
                        </SelectItem>
                        <SelectItem value="week">
                          {t("interval.week")}
                        </SelectItem>
                        <SelectItem value="month">
                          {t("interval.month")}
                        </SelectItem>
                        <SelectItem value="year">
                          {t("interval.year")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      {t("planForm.billingIntervalHelper")}
                    </FieldDescription>
                  </Field>

                  <Field name="billingIntervalCount">
                    <FieldLabel>
                      {t("planForm.billingIntervalCountLabel")}
                    </FieldLabel>
                    <NumberField
                      min={1}
                      max={365}
                      step={1}
                      value={billingIntervalCount}
                      onValueChange={(value) =>
                        setBillingIntervalCount(value ?? 1)
                      }
                    />
                    <FieldDescription>
                      {t("planForm.billingIntervalCountHelper")}
                    </FieldDescription>
                  </Field>
                </>
              ) : null}

              <Field name="trialDays">
                <FieldLabel>{t("planForm.trialDaysLabel")}</FieldLabel>
                <NumberField
                  min={0}
                  max={3650}
                  step={1}
                  value={trialDays}
                  onValueChange={(value) => setTrialDays(value ?? 0)}
                />
                <FieldDescription>
                  {t("planForm.trialDaysHelper")}
                </FieldDescription>
              </Field>
            </div>
          </Fieldset>

          <Fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
            <FieldsetLegend className="text-foreground-intense text-sm font-semibold">
              {t("planForm.section.credit")}
            </FieldsetLegend>
            <p className="text-foreground-muted text-xs">
              {t("planForm.creditWindowsHelper")}
            </p>

            <div className="flex flex-col gap-3">
              {creditWindows.map((window) => (
                <div
                  key={window.id}
                  className="border-border-muted bg-background grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
                >
                  <Field name={`creditWindowPeriod-${window.id}`}>
                    <FieldLabel>
                      {t("planForm.creditWindowPeriodLabel")}
                    </FieldLabel>
                    <Select
                      value={window.period}
                      onValueChange={(value) =>
                        updateCreditWindow(window.id, {
                          period: value as CreditWindowPeriod,
                        })
                      }
                    >
                      <SelectTrigger
                        aria-label={t("planForm.creditWindowPeriodLabel")}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="total">
                          {t("planForm.period.total")}
                        </SelectItem>
                        <SelectItem value="hour">
                          {t("planForm.period.hour")}
                        </SelectItem>
                        <SelectItem value="day">
                          {t("planForm.period.day")}
                        </SelectItem>
                        <SelectItem value="week">
                          {t("planForm.period.week")}
                        </SelectItem>
                        <SelectItem value="month">
                          {t("planForm.period.month")}
                        </SelectItem>
                        <SelectItem value="year">
                          {t("planForm.period.year")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field name={`creditWindowCount-${window.id}`}>
                    <FieldLabel>
                      {t("planForm.creditWindowCountLabel")}
                    </FieldLabel>
                    <NumberField
                      min={1}
                      step={1}
                      value={window.periodCount}
                      onValueChange={(value) =>
                        updateCreditWindow(window.id, {
                          periodCount: value ?? 1,
                        })
                      }
                      disabled={window.period === "total"}
                    />
                  </Field>

                  <Field name={`creditWindowAmount-${window.id}`}>
                    <FieldLabel>
                      {t("planForm.creditWindowAmountLabel")}
                    </FieldLabel>
                    <NumberField
                      min={0}
                      step={1}
                      value={window.creditAmount}
                      onValueChange={(value) =>
                        updateCreditWindow(window.id, {
                          creditAmount: value ?? 0,
                        })
                      }
                    />
                  </Field>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeCreditWindow(window.id)}
                    disabled={creditWindows.length <= 1}
                    aria-label={t("planForm.creditWindowRemove")}
                  >
                    <Trash className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() =>
                setCreditWindows((windows) => [
                  ...windows,
                  makeCreditWindow(),
                ])
              }
            >
              <Plus data-icon="start" className="size-4" />
              {t("planForm.creditWindowAdd")}
            </Button>

            <label className="border-border bg-background flex items-center justify-between gap-4 rounded-lg border p-4 text-sm select-none">
              <span className="flex flex-col">
                <span className="text-foreground-intense font-medium">
                  {t("planForm.rolloverLabel")}
                </span>
                <span className="text-foreground-muted text-xs">
                  {t("planForm.rolloverHelper")}
                </span>
              </span>
              <Switch
                checked={rolloverEnabled}
                onCheckedChange={setRolloverEnabled}
                aria-label={t("planForm.rolloverLabel")}
              />
            </label>

            {rolloverEnabled ? (
              <Field
                name="rolloverCap"
                invalid={Boolean(errors.rolloverCap?.[0])}
              >
                <FieldLabel>{t("planForm.rolloverCapLabel")}</FieldLabel>
                <NumberField
                  min={0}
                  step={1}
                  value={rolloverCap}
                  onValueChange={(value) => setRolloverCap(value ?? 0)}
                  aria-invalid={errors.rolloverCap ? true : undefined}
                  className="data-invalid:motion-safe:animate-shake"
                />
                <FieldDescription>
                  {t("planForm.rolloverCapHelper")}
                </FieldDescription>
                <FieldError>{errors.rolloverCap?.[0]}</FieldError>
              </Field>
            ) : null}

            <label className="border-border bg-background flex items-center justify-between gap-4 rounded-lg border p-4 text-sm select-none">
              <span className="flex flex-col">
                <span className="text-foreground-intense font-medium">
                  {t("planForm.negativeBalanceLabel")}
                </span>
                <span className="text-foreground-muted text-xs">
                  {t("planForm.negativeBalanceHelper")}
                </span>
              </span>
              <Switch
                checked={negativeBalanceAllowed}
                onCheckedChange={setNegativeBalanceAllowed}
                aria-label={t("planForm.negativeBalanceLabel")}
              />
            </label>

            {negativeBalanceAllowed ? (
              <Field
                name="maxNegativeBalance"
                invalid={Boolean(errors.maxNegativeBalance?.[0])}
              >
                <FieldLabel>
                  {t("planForm.maxNegativeBalanceLabel")}
                </FieldLabel>
                <NumberField
                  min={0}
                  step={1}
                  value={maxNegativeBalance}
                  onValueChange={(value) =>
                    setMaxNegativeBalance(value ?? 0)
                  }
                  aria-invalid={errors.maxNegativeBalance ? true : undefined}
                  className="data-invalid:motion-safe:animate-shake"
                />
                <FieldDescription>
                  {t("planForm.maxNegativeBalanceHelper")}
                </FieldDescription>
                <FieldError>
                  {errors.maxNegativeBalance?.[0]}
                </FieldError>
              </Field>
            ) : null}
          </Fieldset>

          <Fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
            <FieldsetLegend className="text-foreground-intense text-sm font-semibold">
              {t("planForm.section.upload")}
            </FieldsetLegend>
            <Field name="allowedUploads">
              <FieldLabel>
                {t("planForm.uploadExtensionsLabel")}
              </FieldLabel>
              <Input
                name="allowedUploads"
                value={allowedUploads}
                onChange={(event) =>
                  setAllowedUploads(event.target.value)
                }
                placeholder={t("planForm.uploadExtensionsPlaceholder")}
                dir="ltr"
                className="font-mono text-start"
              />
              <FieldDescription>
                {t("planForm.uploadExtensionsHelper")}
              </FieldDescription>
            </Field>
          </Fieldset>

          <Fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
            <FieldsetLegend className="text-foreground-intense text-sm font-semibold">
              {t("planForm.section.features")}
            </FieldsetLegend>
            <p className="text-foreground-muted text-xs">
              {t("planForm.featuresHelper")}
            </p>
            {features.length === 0 ? (
              <p className="text-foreground-muted text-sm">
                {t("plan.noFeatures")}
              </p>
            ) : (
              <CheckboxGroup
                aria-labelledby="plan-features-label"
                allValues={features.map((feature) => feature.id)}
                value={featureIds}
                onValueChange={(value) => setFeatureIds(value as string[])}
                className="max-h-56 gap-1 overflow-y-auto"
              >
                <label className="flex items-center gap-2 text-sm font-medium select-none">
                  <Checkbox parent />
                  <span id="plan-features-label">
                    {t("planForm.selectAllFeatures")}
                  </span>
                </label>
                <div className="flex flex-col gap-1 ps-6">
                  {features.map((feature) => (
                    <label
                      key={feature.id}
                      className="flex items-center gap-2 text-sm select-none"
                    >
                      <Checkbox name={feature.id} />
                      <span className="flex flex-col">
                        <span className="text-foreground-intense">
                          {feature.name}
                        </span>
                        <code className="text-foreground-muted font-mono text-xs">
                          {feature.code}
                        </code>
                      </span>
                    </label>
                  ))}
                </div>
              </CheckboxGroup>
            )}
          </Fieldset>

          <Fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
            <FieldsetLegend className="text-foreground-intense text-sm font-semibold">
              {t("planForm.section.addons")}
            </FieldsetLegend>
            <p className="text-foreground-muted text-xs">
              {t("planForm.addonsHelper")}
            </p>
            {addons.length === 0 ? (
              <p className="text-foreground-muted text-sm">
                {t("planForm.noAddons")}
              </p>
            ) : (
              <CheckboxGroup
                aria-label={t("planForm.section.addons")}
                value={addonIds}
                onValueChange={(value) => setAddonIds(value as string[])}
                className="max-h-56 gap-1 overflow-y-auto"
              >
                {addons.map((addon) => (
                  <label
                    key={addon.id}
                    className="flex items-center gap-2 text-sm select-none"
                  >
                    <Checkbox name={addon.id} />
                    <span className="flex flex-col">
                      <span className="text-foreground-intense">
                        {addon.name}
                      </span>
                      <code className="text-foreground-muted font-mono text-xs">
                        {addon.code}
                      </code>
                    </span>
                  </label>
                ))}
              </CheckboxGroup>
            )}
          </Fieldset>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border p-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isPending}
          >
            {t("planForm.cancel")}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? (
              <Spinner currentColor className="text-[1.2em]" />
            ) : (
              <Check data-icon="start" className="size-4" />
            )}
            {isPending ? t("actions.saving") : t("planForm.create")}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
