"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@appica/ui-react/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@appica/ui-react/field";
import { Fieldset, FieldsetLegend } from "@appica/ui-react/fieldset";
import { Radio } from "@appica/ui-react/radio";
import { RadioGroup } from "@appica/ui-react/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@appica/ui-react/select";
import { Switch } from "@appica/ui-react/switch";
import { NumberField } from "@appica/ui-react/number-field";
import { Input } from "@appica/ui-react/input";
import { Badge } from "@appica/ui-react/badge";
import { Separator } from "@appica/ui-react/separator";
import { Button } from "@appica/ui-react/button";
import { Spinner } from "@appica/ui-react/spinner";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@appica/ui-react/alert";
import { Check, CircleX } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { savePlanFeaturePolicy } from "@/features/plans/actions";
import type {
  AccessMode,
  FeaturePolicyItem,
  FeaturePriceMetric,
  FeaturePriceModel,
  FeatureWorkspaceItem,
  LimitBehavior,
  LimitMode,
  LimitPeriod,
  PlanPolicyActionState,
  PlanWorkspaceVersion,
  PricingMode,
  SavePlanFeaturePolicyInput,
} from "@/features/plans/types";
import { translate, type PlansKey } from "@/i18n/plans";

interface PlanLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planVersion: PlanWorkspaceVersion;
  feature: FeatureWorkspaceItem;
  policy: FeaturePolicyItem;
  onSaved: (message: string, versionId?: string, versionNumber?: number) => void;
}

export function PlanLimitDialog({
  open,
  onOpenChange,
  planVersion,
  feature,
  policy,
  onSaved,
}: PlanLimitDialogProps) {
  const { locale } = useLocale();
  const t = (key: PlansKey) => translate(locale, key);

  const [accessMode, setAccessMode] = useState<AccessMode>("inherit");
  const [limitMode, setLimitMode] = useState<LimitMode>("unlimited");
  const [limitValue, setLimitValue] = useState("");
  const [period, setPeriod] = useState<LimitPeriod>("none");
  const [behavior, setBehavior] = useState<LimitBehavior>("block");
  const [overageUnitPrice, setOverageUnitPrice] = useState("");
  const [pricingMode, setPricingMode] = useState<PricingMode>("free");
  const [metric, setMetric] = useState<FeaturePriceMetric>("unit");
  const [pricingModel, setPricingModel] =
    useState<FeaturePriceModel>("flat");
  const [currency, setCurrency] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [creditCostPerUnit, setCreditCostPerUnit] = useState("");
  const [minimumCharge, setMinimumCharge] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setAccessMode(
      policy.isIncluded === null
        ? "inherit"
        : policy.isIncluded
          ? "allow"
          : "deny",
    );
    setLimitMode(policy.limitValue === null ? "unlimited" : "custom");
    setLimitValue(policy.limitValue ?? "");
    setPeriod(policy.period ?? "none");
    setBehavior(policy.behavior ?? "block");
    setOverageUnitPrice(policy.overageUnitPrice ?? "");
    setPricingMode(policy.metric === null ? "free" : "custom");
    setMetric(policy.metric ?? "unit");
    setPricingModel(policy.pricingModel ?? "flat");
    setCurrency(policy.currency ?? "");
    setUnitPrice(policy.unitPrice ?? "");
    setCreditCostPerUnit(policy.creditCostPerUnit ?? "");
    setMinimumCharge(policy.minimumCharge ?? "");
    setFieldErrors({});
    setServerError(null);
  }, [open, policy]);

  const validate = (): Record<string, string[]> => {
    const errors: Record<string, string[]> = {};
    if (limitMode === "custom") {
      if (!/^\d+$/.test(limitValue)) {
        errors.limitValue = [t("errors.limitWhole")];
      }
      if (
        behavior === "allow_overage" &&
        overageUnitPrice.trim() !== "" &&
        !/^\d+$/.test(overageUnitPrice)
      ) {
        errors.overageUnitPrice = [t("errors.overageWhole")];
      }
    }
    if (pricingMode === "custom") {
      if (!/^[A-Z]{3}$/.test(currency)) {
        errors.currency = [t("errors.currency")];
      }
      for (const [field, value] of [
        ["unitPrice", unitPrice],
        ["creditCostPerUnit", creditCostPerUnit],
        ["minimumCharge", minimumCharge],
      ] as const) {
        if (value.trim() !== "" && !/^\d+$/.test(value)) {
          errors[field] = [t("errors.priceWhole")];
        }
      }
    }
    return errors;
  };

  const handleSave = () => {
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const input: SavePlanFeaturePolicyInput = {
      planVersionId: planVersion.id,
      featureId: feature.id,
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
      locale,
    };

    setServerError(null);
    startTransition(async () => {
      const result: PlanPolicyActionState =
        await savePlanFeaturePolicy(input);
      if (result.status === "success") {
        onOpenChange(false);
        onSaved(result.message, result.versionId, result.versionNumber);
        return;
      }
      setFieldErrors(result.fieldErrors ?? {});
      setServerError(result.message);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:w-200">
        <DialogHeader>
          <DialogTitle>{t("dialog.title")}</DialogTitle>
          <DialogDescription>{t("dialog.description")}</DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-5">
          <div className="text-foreground-muted flex flex-wrap items-center gap-2 text-sm">
            <span className="text-foreground-intense font-medium">
              {feature.name}
            </span>
            <code className="font-mono text-xs">{feature.code}</code>
            <Separator orientation="vertical" className="h-4" />
            <span>
              {t("dialog.version")}: v{planVersion.versionNumber}
            </span>
            <Badge
              variant={
                planVersion.status === "published"
                  ? "success"
                  : planVersion.status === "draft"
                    ? "warning"
                    : "outline"
              }
            >
              {t(`versionStatus.${planVersion.status}` as PlansKey)}
            </Badge>
          </div>

          <Alert variant="info" layout="inline">
            <AlertIcon>
              <CircleX />
            </AlertIcon>
            <AlertTitle>{t("dialog.versionNote")}</AlertTitle>
          </Alert>

          {serverError ? (
            <Alert variant="error">
              <AlertIcon>
                <CircleX />
              </AlertIcon>
              <AlertTitle>{t("actions.failed")}</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}

          <Fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
            <FieldsetLegend className="text-foreground-intense text-sm font-semibold">
              {t("dialog.accessSection")}
            </FieldsetLegend>
            <RadioGroup
              value={accessMode}
              onValueChange={(value) => setAccessMode(value as AccessMode)}
              aria-label={t("field.access.label")}
            >
              {(["inherit", "allow", "deny"] as const).map((value) => (
                <label
                  key={value}
                  className="text-foreground flex items-center gap-2 text-sm select-none"
                >
                  <Radio value={value} />
                  {t(`values.${value}` as PlansKey)}
                </label>
              ))}
            </RadioGroup>
            <p className="text-foreground-muted text-xs">
              {t("field.access.helper")}
            </p>
          </Fieldset>

          <Fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
            <FieldsetLegend className="text-foreground-intense text-sm font-semibold">
              {t("dialog.limitSection")}
            </FieldsetLegend>
            <label className="border-border-muted bg-background flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-3 text-sm select-none">
              <span className="flex flex-col">
                <span className="text-foreground-intense font-medium">
                  {t("field.limitToggle.label")}
                </span>
                <span className="text-foreground-muted text-xs">
                  {t("field.limitToggle.helper")}
                </span>
              </span>
              <Switch
                checked={limitMode === "custom"}
                onCheckedChange={(checked) =>
                  setLimitMode(checked ? "custom" : "unlimited")
                }
                aria-label={t("field.limitToggle.label")}
              />
            </label>

            {limitMode === "custom" ? (
              <div className="ds-fade-in grid gap-4 sm:grid-cols-2">
                <Field
                  name="limitValue"
                  invalid={Boolean(fieldErrors.limitValue?.[0])}
                >
                  <FieldLabel>{t("field.limitValue.label")}</FieldLabel>
                  <NumberField
                    min={0}
                    step={1}
                    value={limitValue === "" ? null : Number(limitValue)}
                    onValueChange={(value) =>
                      setLimitValue(value === null ? "" : String(value))
                    }
                    className="data-invalid:motion-safe:animate-shake"
                  />
                  <FieldDescription>
                    {t("field.limitValue.helper")}
                    {feature.unitName ? ` (${feature.unitName})` : ""}
                  </FieldDescription>
                  <FieldError>{fieldErrors.limitValue?.[0]}</FieldError>
                </Field>
                <Field name="period">
                  <FieldLabel>{t("field.period.label")}</FieldLabel>
                  <Select
                    value={period}
                    onValueChange={(value) =>
                      setPeriod(value as LimitPeriod)
                    }
                  >
                    <SelectTrigger aria-label={t("field.period.label")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("period.none")}</SelectItem>
                      <SelectItem value="day">{t("period.day")}</SelectItem>
                      <SelectItem value="week">{t("period.week")}</SelectItem>
                      <SelectItem value="month">{t("period.month")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldDescription>{t("field.period.helper")}</FieldDescription>
                </Field>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <span className="text-foreground-intense text-sm font-medium">
                    {t("field.behavior.label")}
                  </span>
                  <RadioGroup
                    value={behavior}
                    onValueChange={(value) =>
                      setBehavior(value as LimitBehavior)
                    }
                    orientation="horizontal"
                    aria-label={t("field.behavior.label")}
                    className="gap-4"
                  >
                    <label className="flex items-center gap-2 text-sm select-none">
                      <Radio value="block" />
                      {t("values.block")}
                    </label>
                    <label className="flex items-center gap-2 text-sm select-none">
                      <Radio value="allow_overage" />
                      {t("values.allowOverage")}
                    </label>
                  </RadioGroup>
                  <p className="text-foreground-muted text-xs">
                    {t("field.behavior.helper")}
                  </p>
                </div>
                {behavior === "allow_overage" ? (
                  <Field
                    name="overageUnitPrice"
                    invalid={Boolean(fieldErrors.overageUnitPrice?.[0])}
                    className="sm:col-span-2"
                  >
                    <FieldLabel>{t("field.overage.label")}</FieldLabel>
                    <NumberField
                      min={0}
                      step={1}
                      value={
                        overageUnitPrice === "" ? null : Number(overageUnitPrice)
                      }
                      onValueChange={(value) =>
                        setOverageUnitPrice(value === null ? "" : String(value))
                      }
                      className="data-invalid:motion-safe:animate-shake"
                    />
                    <FieldDescription>
                      {t("field.overage.helper")}
                    </FieldDescription>
                    <FieldError>
                      {fieldErrors.overageUnitPrice?.[0]}
                    </FieldError>
                  </Field>
                ) : null}
              </div>
            ) : null}
          </Fieldset>

          <Fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
            <FieldsetLegend className="text-foreground-intense text-sm font-semibold">
              {t("dialog.pricingSection")}
            </FieldsetLegend>
            <label className="border-border-muted bg-background flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-3 text-sm select-none">
              <span className="flex flex-col">
                <span className="text-foreground-intense font-medium">
                  {t("field.pricingToggle.label")}
                </span>
                <span className="text-foreground-muted text-xs">
                  {t("field.pricingToggle.helper")}
                </span>
              </span>
              <Switch
                checked={pricingMode === "custom"}
                onCheckedChange={(checked) =>
                  setPricingMode(checked ? "custom" : "free")
                }
                aria-label={t("field.pricingToggle.label")}
              />
            </label>

            {pricingMode === "custom" ? (
              <div className="ds-fade-in grid gap-4 sm:grid-cols-2">
                <Field name="metric">
                  <FieldLabel>{t("field.metric.label")}</FieldLabel>
                  <Select
                    value={metric}
                    onValueChange={(value) =>
                      setMetric(value as FeaturePriceMetric)
                    }
                  >
                    <SelectTrigger aria-label={t("field.metric.label")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unit">{t("metric.unit")}</SelectItem>
                      <SelectItem value="minute">
                        {t("metric.minute")}
                      </SelectItem>
                      <SelectItem value="megabyte">
                        {t("metric.megabyte")}
                      </SelectItem>
                      <SelectItem value="request">
                        {t("metric.request")}
                      </SelectItem>
                      <SelectItem value="seat">{t("metric.seat")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldDescription>{t("field.metric.helper")}</FieldDescription>
                </Field>
                <Field name="pricingModel">
                  <FieldLabel>{t("field.pricingModel.label")}</FieldLabel>
                  <Select
                    value={pricingModel}
                    onValueChange={(value) =>
                      setPricingModel(value as FeaturePriceModel)
                    }
                  >
                    <SelectTrigger aria-label={t("field.pricingModel.label")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">Flat</SelectItem>
                      <SelectItem value="tiered">Tiered</SelectItem>
                      <SelectItem value="volume">Volume</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    {t("field.pricingModel.helper")}
                  </FieldDescription>
                </Field>
                <Field
                  name="currency"
                  invalid={Boolean(fieldErrors.currency?.[0])}
                >
                  <FieldLabel>{t("field.currency.label")}</FieldLabel>
                  <Input
                    name="currency"
                    value={currency}
                    onChange={(event) =>
                      setCurrency(
                        event.target.value.toUpperCase().slice(0, 3),
                      )
                    }
                    placeholder="USD"
                    aria-invalid={fieldErrors.currency ? true : undefined}
                    className="data-invalid:motion-safe:animate-shake"
                  />
                  <FieldDescription>{t("field.currency.helper")}</FieldDescription>
                  <FieldError>{fieldErrors.currency?.[0]}</FieldError>
                </Field>
                <Field
                  name="unitPrice"
                  invalid={Boolean(fieldErrors.unitPrice?.[0])}
                >
                  <FieldLabel>{t("field.unitPrice.label")}</FieldLabel>
                  <NumberField
                    min={0}
                    step={1}
                    value={unitPrice === "" ? null : Number(unitPrice)}
                    onValueChange={(value) =>
                      setUnitPrice(value === null ? "" : String(value))
                    }
                    className="data-invalid:motion-safe:animate-shake"
                  />
                  <FieldDescription>{t("field.unitPrice.helper")}</FieldDescription>
                  <FieldError>{fieldErrors.unitPrice?.[0]}</FieldError>
                </Field>
                <Field
                  name="creditCostPerUnit"
                  invalid={Boolean(fieldErrors.creditCostPerUnit?.[0])}
                >
                  <FieldLabel>{t("field.creditCost.label")}</FieldLabel>
                  <NumberField
                    min={0}
                    step={1}
                    value={
                      creditCostPerUnit === ""
                        ? null
                        : Number(creditCostPerUnit)
                    }
                    onValueChange={(value) =>
                      setCreditCostPerUnit(value === null ? "" : String(value))
                    }
                    className="data-invalid:motion-safe:animate-shake"
                  />
                  <FieldDescription>
                    {t("field.creditCost.helper")}
                  </FieldDescription>
                  <FieldError>
                    {fieldErrors.creditCostPerUnit?.[0]}
                  </FieldError>
                </Field>
                <Field
                  name="minimumCharge"
                  invalid={Boolean(fieldErrors.minimumCharge?.[0])}
                >
                  <FieldLabel>{t("field.minimumCharge.label")}</FieldLabel>
                  <NumberField
                    min={0}
                    step={1}
                    value={minimumCharge === "" ? null : Number(minimumCharge)}
                    onValueChange={(value) =>
                      setMinimumCharge(value === null ? "" : String(value))
                    }
                    className="data-invalid:motion-safe:animate-shake"
                  />
                  <FieldDescription>
                    {t("field.minimumCharge.helper")}
                  </FieldDescription>
                  <FieldError>
                    {fieldErrors.minimumCharge?.[0]}
                  </FieldError>
                </Field>
              </div>
            ) : null}
          </Fieldset>
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t("actions.cancel")}
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
            {isPending ? t("actions.saving") : t("actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
