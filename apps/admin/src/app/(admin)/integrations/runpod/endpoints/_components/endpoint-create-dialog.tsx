"use client";

import * as React from "react";
import { createEndpointAction } from "@/integrations/runpod/server/mutations";
import {
  Dialog, DialogContent,
} from "@/components/ui/overlay";
import { Button } from "@/components/ui/actions";
import { TextInput, NumberInput, Field } from "@/components/ui/inputs";
import { Select } from "@/components/ui/select-combobox";
import { Alert } from "@/components/ui/feedback";
import { Text } from "@/components/ui/typography";
import { Stack, Inline, Grid } from "@/components/ui/layout";
import { Divider } from "@/components/ui/data-display";
import { Plus, X } from "lucide-react";
import { RUNPOD_GPU_TYPE_OPTIONS, RUNPOD_DATA_CENTER_OPTIONS, localizeReferenceOptions } from "@/integrations/runpod/reference-data";
import { useI18n } from "@/i18n/client";
import type { TemplateSummary, NetworkVolumeSummary } from "@/integrations/runpod/types";

interface EnvVar {
  key: string;
  value: string;
}

interface EndpointCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: TemplateSummary[];
  networkVolumes: NetworkVolumeSummary[];
  onSuccess: () => void;
}

export function EndpointCreateDialog({
  open,
  onOpenChange,
  templates,
  networkVolumes,
  onSuccess,
}: EndpointCreateDialogProps) {
  const { t } = useI18n();
  const [name, setName] = React.useState("");
  const [templateId, setTemplateId] = React.useState("");
  const [computeType, setComputeType] = React.useState<"GPU" | "CPU">("GPU");
  const [gpuTypeId, setGpuTypeId] = React.useState("");
  const [gpuCount, setGpuCount] = React.useState<number>(1);
  const [workersMin, setWorkersMin] = React.useState<number>(0);
  const [workersMax, setWorkersMax] = React.useState<number>(3);
  const [idleTimeout, setIdleTimeout] = React.useState<number>(5);
  const [executionTimeoutMs, setExecutionTimeoutMs] = React.useState<number | undefined>(undefined);
  const [scalerType, setScalerType] = React.useState<"QUEUE_DELAY" | "REQUEST_COUNT">("QUEUE_DELAY");
  const [scalerValue, setScalerValue] = React.useState<number>(4);
  const [dataCenterId, setDataCenterId] = React.useState("");
  const [networkVolumeId, setNetworkVolumeId] = React.useState("");
  const [envVars, setEnvVars] = React.useState<EnvVar[]>([]);

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const templateOptions = React.useMemo(
    () => templates.map((tpl) => ({ value: tpl.id, label: tpl.name ?? tpl.id.slice(0, 8) })),
    [templates],
  );

  const volumeOptions = React.useMemo(
    () => [
      { value: "", label: t("runpod.common.none") },
      ...networkVolumes.map((v) => ({ value: v.id, label: v.name ?? v.id.slice(0, 8) })),
    ],
    [networkVolumes, t],
  );

  const resetForm = React.useCallback(() => {
    setName("");
    setTemplateId("");
    setComputeType("GPU");
    setGpuTypeId("");
    setGpuCount(1);
    setWorkersMin(0);
    setWorkersMax(3);
    setIdleTimeout(5);
    setExecutionTimeoutMs(undefined);
    setScalerType("QUEUE_DELAY");
    setScalerValue(4);
    setDataCenterId("");
    setNetworkVolumeId("");
    setEnvVars([]);
    setError(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation for required fields
    if (!name.trim()) {
      setError(t("runpod.endpoints.create.errors.nameRequired"));
      return;
    }
    if (!templateId) {
      setError(t("runpod.endpoints.create.errors.templateRequired"));
      return;
    }

    const env: Record<string, string> = {};
    for (const ev of envVars) {
      if (ev.key.trim()) {
        env[ev.key.trim()] = ev.value;
      }
    }

    setSubmitting(true);
    try {
      const result = await createEndpointAction({
        name: name.trim(),
        templateId,
        computeType,
        gpuTypeIds: gpuTypeId ? [gpuTypeId] : undefined,
        gpuCount: gpuCount,
        workersMin,
        workersMax,
        idleTimeout,
        executionTimeoutMs: executionTimeoutMs || undefined,
        scalerType,
        scalerValue,
        dataCenterIds: dataCenterId ? [dataCenterId] : undefined,
        networkVolumeId: networkVolumeId || undefined,
        env,
      });

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("runpod.common.unexpectedError"));
    } finally {
      setSubmitting(false);
    }
  };

  const addEnvVar = () => {
    setEnvVars((prev) => [...prev, { key: "", value: "" }]);
  };

  const removeEnvVar = (index: number) => {
    setEnvVars((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEnvVar = (index: number, field: "key" | "value", val: string) => {
    setEnvVars((prev) => prev.map((ev, i) => (i === index ? { ...ev, [field]: val } : ev)));
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { onOpenChange(next); if (!next) resetForm(); }}>
      <DialogContent
        title={t("runpod.endpoints.create.title")}
        description={t("runpod.endpoints.create.description")}
        size="lg"
        footer={
          <Inline gap="sm" justify="end">
            <Button variant="secondary" type="button" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button loading={submitting} onClick={handleSubmit}>
              {t("runpod.endpoints.create.submit")}
            </Button>
          </Inline>
        }
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            {error && <Alert tone="danger" title={error} />}

            {/* Basic info */}
            <Grid columns={2} gap="md">
              <Field label={t("runpod.common.name")} required>
                <TextInput
                  placeholder={t("runpod.endpoints.create.namePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field label={t("runpod.common.template")} required>
                <Select
                  options={templateOptions}
                  placeholder={t("runpod.endpoints.create.templatePlaceholder")}
                  value={templateId}
                  onValueChange={setTemplateId}
                />
              </Field>
            </Grid>

            <Divider label={t("runpod.endpoints.create.dividerCompute")} />

            <Grid columns={3} gap="md">
              <Field label={t("runpod.endpoints.create.computeTypeLabel")}>
                <Select
                  options={[
                    { value: "GPU", label: "GPU" },
                    { value: "CPU", label: "CPU" },
                  ]}
                  value={computeType}
                  onValueChange={(v) => setComputeType(v as "GPU" | "CPU")}
                />
              </Field>
              {computeType === "GPU" && (
                <>
                  <Field label={t("runpod.endpoints.create.gpuTypeLabel")}>
                    <Select
                      options={RUNPOD_GPU_TYPE_OPTIONS}
                      placeholder={t("runpod.endpoints.create.gpuTypePlaceholder")}
                      value={gpuTypeId}
                      onValueChange={setGpuTypeId}
                    />
                  </Field>
                  <Field label={t("runpod.common.gpuCount")}>
                    <NumberInput value={gpuCount} onChange={setGpuCount} min={1} max={8} />
                  </Field>
                </>
              )}
            </Grid>

            <Divider label={t("runpod.endpoints.create.dividerScaling")} />

            <Grid columns={2} gap="md">
              <Field label={t("runpod.endpoints.create.minWorkersLabel")}>
                <NumberInput value={workersMin} onChange={setWorkersMin} min={0} max={100} />
              </Field>
              <Field label={t("runpod.endpoints.create.maxWorkersLabel")}>
                <NumberInput value={workersMax} onChange={setWorkersMax} min={1} max={100} />
              </Field>
            </Grid>

            <Grid columns={2} gap="md">
              <Field label={t("runpod.endpoints.create.scalerTypeLabel")}>
                <Select
                  options={[
                    { value: "QUEUE_DELAY", label: t("runpod.endpoints.create.queueDelay") },
                    { value: "REQUEST_COUNT", label: t("runpod.endpoints.create.requestCount") },
                  ]}
                  value={scalerType}
                  onValueChange={(v) => setScalerType(v as "QUEUE_DELAY" | "REQUEST_COUNT")}
                />
              </Field>
              <Field label={t("runpod.endpoints.create.scalerValueLabel")}>
                <NumberInput value={scalerValue} onChange={setScalerValue} min={1} max={1000} />
              </Field>
            </Grid>

            <Divider label={t("runpod.endpoints.create.dividerTimeouts")} />

            <Grid columns={2} gap="md">
              <Field label={t("runpod.common.idleTimeout")} helper={t("runpod.endpoints.create.idleTimeoutHelper")}>
                <NumberInput value={idleTimeout} onChange={setIdleTimeout} min={1} max={3600} />
              </Field>
              <Field label={t("runpod.common.executionTimeout")} helper={t("runpod.endpoints.create.executionTimeoutHelper")}>
                <NumberInput
                  value={executionTimeoutMs}
                  onChange={(v) => setExecutionTimeoutMs(v || undefined)}
                  min={1000}
                  max={86_400_000}
                />
              </Field>
            </Grid>

            <Divider label={t("runpod.endpoints.create.dividerLocation")} />

            <Grid columns={2} gap="md">
              <Field label={t("runpod.common.dataCenter")}>
                <Select
                  options={localizeReferenceOptions(RUNPOD_DATA_CENTER_OPTIONS, t)}
                  placeholder={t("runpod.common.selectDataCenter")}
                  value={dataCenterId}
                  onValueChange={setDataCenterId}
                />
              </Field>
              <Field label={t("runpod.endpoints.create.networkVolumeLabel")} helper={t("runpod.endpoints.create.networkVolumeHelper")}>
                <Select
                  options={volumeOptions}
                  placeholder={t("runpod.common.none")}
                  value={networkVolumeId}
                  onValueChange={setNetworkVolumeId}
                />
              </Field>
            </Grid>

            <Divider label={t("runpod.common.environmentVariables")} />

            <Stack gap="sm">
              {envVars.map((ev, i) => (
                <Inline key={i} gap="sm" align="center">
                  <TextInput
                    placeholder={t("runpod.common.envKey")}
                    value={ev.key}
                    onChange={(e) => updateEnvVar(i, "key", e.target.value)}
                    className="flex-1"
                  />
                  <TextInput
                    placeholder={t("runpod.common.envValue")}
                    value={ev.value}
                    onChange={(e) => updateEnvVar(i, "value", e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => removeEnvVar(i)}
                    aria-label={t("runpod.common.removeEnvVar")}
                  >
                    <X className="size-4" />
                  </Button>
                </Inline>
              ))}
              <Inline>
                <Button variant="soft" size="sm" type="button" leadingIcon={<Plus className="size-4" />} onClick={addEnvVar}>
                  {t("runpod.common.addVariable")}
                </Button>
              </Inline>
              {envVars.length === 0 && (
                <Text size="sm" tone="muted">
                  {t("runpod.endpoints.create.noEnvVars")}
                </Text>
              )}
            </Stack>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
