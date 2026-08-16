"use client";

import { useActionState, useState } from "react";
import {
  ArrowLeft,
  Boxes,
  Check,
  Gauge,
  Network,
  Rocket,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/actions";
import { Badge, Card } from "@/components/ui/data-display";
import { Alert } from "@/components/ui/feedback";
import { Switch } from "@/components/ui/form-controls";
import { Field, Textarea, TextInput } from "@/components/ui/inputs";
import { Breadcrumb, Stepper } from "@/components/ui/navigation";
import { MultiSelect, Select } from "@/components/ui/select-combobox";
import { Heading, Text } from "@/components/ui/typography";
import { LocalizedLink, useI18n } from "@/i18n/client";
import { createFeature } from "../actions";
import type {
  FeatureActionState,
  FeatureCreationData,
  FeatureKind,
} from "../types";

const initialState: FeatureActionState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

function slugifyFeatureCode(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function FieldError({
  state,
  name,
}: {
  state: FeatureActionState;
  name: string;
}) {
  const message = state.fieldErrors[name]?.[0];
  return message ? (
    <Text size="xs" className="mt-1 text-danger-600">
      {message}
    </Text>
  ) : null;
}

export function FeatureBuilder({ data }: { data: FeatureCreationData }) {
  const { t, locale } = useI18n();
  const [state, formAction, pending] = useActionState(createFeature, initialState);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<FeatureKind>("boolean");
  const [unitName, setUnitName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [defaultAccess, setDefaultAccess] = useState<"allow" | "deny">("allow");
  const [metadataJson, setMetadataJson] = useState("{}");
  const [dependencyIds, setDependencyIds] = useState<string[]>([]);
  const [localError, setLocalError] = useState("");

  const steps = [
    t("features.builder.step.identity"),
    t("features.builder.step.behavior"),
    t("features.builder.step.dependencies"),
    t("features.builder.step.review"),
  ];

  const updateName = (value: string) => {
    setName(value);
    if (!codeTouched) setCode(slugifyFeatureCode(value));
  };

  const validateStep = () => {
    if (step === 0) {
      if (name.trim().length < 2) return t("features.builder.validation.clearName");
      if (!/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(code)) {
        return t("features.builder.validation.validCode");
      }
    }
    if (step === 1 && kind !== "boolean" && !unitName.trim()) {
      return t("features.builder.validation.unitRequired");
    }
    if (step === 1) {
      try {
        const metadata = JSON.parse(metadataJson);
        if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
          return t("features.builder.validation.metadataObject");
        }
      } catch {
        return t("features.builder.validation.metadataJson");
      }
    }
    return "";
  };

  const next = () => {
    const error = validateStep();
    setLocalError(error);
    if (!error) setStep((current) => Math.min(steps.length - 1, current + 1));
  };

  const kindDescription = {
    boolean: t("features.kind.description.boolean"),
    metered: t("features.kind.description.metered"),
    quota: t("features.kind.description.quota"),
    package: t("features.kind.description.package"),
  }[kind];

  return (
    <form action={formAction} className="space-y-6 p-6 max-sm:p-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="defaultAccess" value={defaultAccess} />
      {isActive && <input type="hidden" name="isActive" value="on" />}
      {dependencyIds.map((dependencyId) => (
        <input
          key={dependencyId}
          type="hidden"
          name="dependencyIds"
          value={dependencyId}
        />
      ))}

      <div>
        <Breadcrumb
          items={[
            { label: t("features.catalog"), href: "/features" },
            { label: t("features.createFeature") },
          ]}
        />
        <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Heading level={2}>{t("features.builder.title")}</Heading>
              <Badge tone="primary">{t("features.openByDefault")}</Badge>
            </div>
            <Text tone="muted" size="sm" className="mt-1 max-w-3xl">
              {t("features.builder.subtitle")}
            </Text>
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

      <Card padding="sm" className="overflow-x-auto">
        <div className="min-w-[38rem]">
          <Stepper steps={steps} current={step} />
        </div>
      </Card>

      {(state.status === "error" || localError) && (
        <Alert tone="danger" title={t("features.builder.needsAttention")}>
          {localError || state.message}
        </Alert>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card padding="lg" className="min-w-0">
          <div className={step === 0 ? "space-y-6" : "hidden"}>
            <div className="flex items-start gap-3">
              <div className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-primary-50 text-primary-700">
                <Boxes className="size-4" />
              </div>
              <div>
                <Heading level={5}>{t("features.builder.catalogIdentityTitle")}</Heading>
                <Text size="sm" tone="muted" className="mt-1">
                  {t("features.builder.catalogIdentitySubtitle")}
                </Text>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label={t("features.builder.nameLabel")}
                htmlFor="name"
                required
                state={state.fieldErrors.name ? "error" : "default"}
              >
                <TextInput
                  id="name"
                  name="name"
                  value={name}
                  onChange={(event) => updateName(event.target.value)}
                  placeholder={t("features.builder.namePlaceholder")}
                />
                <FieldError state={state} name="name" />
              </Field>
              <Field
                label={t("features.stableCode")}
                htmlFor="code"
                required
                state={state.fieldErrors.code ? "error" : "default"}
              >
                <TextInput
                  id="code"
                  name="code"
                  value={code}
                  onChange={(event) => {
                    setCodeTouched(true);
                    setCode(event.target.value);
                  }}
                  placeholder="ai_chord_detection"
                />
                <FieldError state={state} name="code" />
              </Field>
            </div>
            <Field label={t("features.description")} htmlFor="description" optional>
              <Textarea
                id="description"
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                placeholder={t("features.builder.descriptionPlaceholder")}
              />
            </Field>
          </div>

          <div className={step === 1 ? "space-y-6" : "hidden"}>
            <div className="flex items-start gap-3">
              <div className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-primary-50 text-primary-700">
                <Settings2 className="size-4" />
              </div>
              <div>
                <Heading level={5}>{t("features.builder.runtimeTitle")}</Heading>
                <Text size="sm" tone="muted" className="mt-1">
                  {t("features.builder.runtimeSubtitle")}
                </Text>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t("features.capabilityType")} required>
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
                <Text size="xs" tone="muted" className="mt-1">
                  {kindDescription}
                </Text>
              </Field>
              <Field
                label={t("features.unitName")}
                htmlFor="unitName"
                optional={kind === "boolean"}
                required={kind !== "boolean"}
                helper={t("features.builder.unitNameHelper")}
              >
                <TextInput
                  id="unitName"
                  name="unitName"
                  value={unitName}
                  onChange={(event) => setUnitName(event.target.value)}
                  placeholder={kind === "boolean" ? t("features.builder.notRequired") : "minute"}
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card padding="sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Text size="sm" weight="semibold">
                      {t("features.globalAvailability")}
                    </Text>
                    <Text size="xs" tone="muted" className="mt-1">
                      {t("features.builder.globalAvailabilityHint")}
                    </Text>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </Card>
              <Field label={t("features.defaultAccess")}>
                <Select
                  value={defaultAccess}
                  onValueChange={(value) =>
                    setDefaultAccess(value as "allow" | "deny")
                  }
                  options={[
                    {
                      value: "allow",
                      label: t("features.builder.allowNoOverride"),
                    },
                    {
                      value: "deny",
                      label: t("features.builder.denyNoOverride"),
                    },
                  ]}
                />
              </Field>
            </div>

            <Field
              label={t("features.extensibleMetadata")}
              htmlFor="metadataJson"
              helper={t("features.builder.metadataHelper")}
              state={state.fieldErrors.metadataJson ? "error" : "default"}
            >
              <Textarea
                id="metadataJson"
                name="metadataJson"
                value={metadataJson}
                onChange={(event) => setMetadataJson(event.target.value)}
                rows={8}
                className="font-mono text-xs"
              />
              <FieldError state={state} name="metadataJson" />
            </Field>
          </div>

          <div className={step === 2 ? "space-y-6" : "hidden"}>
            <div className="flex items-start gap-3">
              <div className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-primary-50 text-primary-700">
                <Network className="size-4" />
              </div>
              <div>
                <Heading level={5}>{t("features.builder.dependenciesTitle")}</Heading>
                <Text size="sm" tone="muted" className="mt-1">
                  {t("features.builder.dependenciesSubtitle")}
                </Text>
              </div>
            </div>
            <Field label={t("features.builder.requiredFeaturesLabel")} optional>
              <MultiSelect
                value={dependencyIds}
                onChange={setDependencyIds}
                placeholder={t("features.builder.noDependencies")}
                options={data.features.map((feature) => ({
                  value: feature.id,
                  label: `${feature.name} · ${feature.code}`,
                }))}
              />
            </Field>
            <Alert tone="info" title={t("features.builder.dependencySafety")}>
              {t("features.builder.dependencySafetyText")}
            </Alert>
          </div>

          <div className={step === 3 ? "space-y-6" : "hidden"}>
            <div className="flex items-start gap-3">
              <div className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-primary-50 text-primary-700">
                <Rocket className="size-4" />
              </div>
              <div>
                <Heading level={5}>{t("features.builder.reviewTitle")}</Heading>
                <Text size="sm" tone="muted" className="mt-1">
                  {t("features.builder.reviewSubtitle")}
                </Text>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card padding="sm">
                <Text size="xs" tone="muted">
                  {t("features.builder.identity")}
                </Text>
                <Text size="sm" weight="semibold" className="mt-2">
                  {name || t("features.builder.unnamedFeature")}
                </Text>
                <Text size="xs" tone="subtle" className="mt-1">
                  {code || t("features.builder.noStableCode")} · {kind}
                </Text>
              </Card>
              <Card padding="sm">
                <Text size="xs" tone="muted">
                  {t("features.builder.fallbackPolicy")}
                </Text>
                <Text size="sm" weight="semibold" className="mt-2">
                  {defaultAccess === "allow"
                    ? t("features.allowedByDefault")
                    : t("features.deniedByDefault")}
                </Text>
                <Text size="xs" tone="subtle" className="mt-1">
                  {t("features.builder.unlimitedUsage")}
                </Text>
              </Card>
              <Card padding="sm">
                <Text size="xs" tone="muted">
                  {t("features.builder.availability")}
                </Text>
                <Text size="sm" weight="semibold" className="mt-2">
                  {isActive
                    ? t("features.builder.activeImmediately")
                    : t("features.builder.createdInactive")}
                </Text>
                <Text size="xs" tone="subtle" className="mt-1">
                  {t("features.builder.statusIndependent")}
                </Text>
              </Card>
              <Card padding="sm">
                <Text size="xs" tone="muted">
                  {t("features.dependencies")}
                </Text>
                <Text size="sm" weight="semibold" className="mt-2">
                  {t("features.builder.requiredCapabilities", {
                    count: dependencyIds.length,
                  })}
                </Text>
                <Text size="xs" tone="subtle" className="mt-1">
                  {t("features.builder.acyclicGraph")}
                </Text>
              </Card>
            </div>
            <Alert tone="success" title={t("features.builder.futurePolicyOptional")}>
              {t("features.builder.futurePolicyOptionalText")}
            </Alert>
          </div>

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-neutral-100 pt-5">
            <Button
              type="button"
              variant="secondary"
              disabled={step === 0 || pending}
              onClick={() => {
                setLocalError("");
                setStep((current) => Math.max(0, current - 1));
              }}
            >
              {t("common.previous")}
            </Button>
            {step < steps.length - 1 ? (
              <Button type="button" onClick={next}>
                {t("features.builder.continue")}
              </Button>
            ) : (
              <Button
                type="submit"
                loading={pending}
                leadingIcon={<Check className="size-4" />}
              >
                {t("features.createFeature")}
              </Button>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card padding="sm">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-4 text-success-600" />
              <div>
                <Text size="sm" weight="semibold">
                  {t("features.builder.enterpriseFallback")}
                </Text>
                <Text size="xs" tone="muted" className="mt-1">
                  {t("features.builder.enterpriseFallbackText")}
                </Text>
              </div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="flex items-start gap-3">
              <Gauge className="mt-0.5 size-4 text-primary-600" />
              <div>
                <Text size="sm" weight="semibold">
                  {t("features.builder.recommendedModeling")}
                </Text>
                <Text size="xs" tone="muted" className="mt-1">
                  {t("features.builder.recommendedModelingText")}
                </Text>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
