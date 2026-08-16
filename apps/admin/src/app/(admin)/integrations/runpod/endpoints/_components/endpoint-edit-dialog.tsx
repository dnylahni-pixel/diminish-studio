"use client";

import * as React from "react";
import { updateEndpointAction } from "@/integrations/runpod/server/mutations";
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
import { useI18n } from "@/i18n/client";
import type { EndpointSummary } from "@/integrations/runpod/types";

interface EnvVar {
  key: string;
  value: string;
}

interface EndpointEditDialogProps {
  endpoint: EndpointSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EndpointEditDialog({
  endpoint,
  open,
  onOpenChange,
  onSuccess,
}: EndpointEditDialogProps) {
  const { t } = useI18n();
  const [name, setName] = React.useState(endpoint.name ?? "");
  const [workersMin, setWorkersMin] = React.useState<number>(endpoint.workersMin ?? 0);
  const [workersMax, setWorkersMax] = React.useState<number>(endpoint.workersMax ?? 3);
  const [idleTimeout, setIdleTimeout] = React.useState<number>(5);
  const [scalerType, setScalerType] = React.useState<"QUEUE_DELAY" | "REQUEST_COUNT">(
    endpoint.scalerType ?? "QUEUE_DELAY",
  );
  const [scalerValue, setScalerValue] = React.useState<number>(endpoint.scalerValue ?? 4);
  const [envVars, setEnvVars] = React.useState<EnvVar[]>([]);

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const resetForm = React.useCallback(() => {
    setName(endpoint.name ?? "");
    setWorkersMin(endpoint.workersMin ?? 0);
    setWorkersMax(endpoint.workersMax ?? 3);
    setIdleTimeout(5);
    setScalerType(endpoint.scalerType ?? "QUEUE_DELAY");
    setScalerValue(endpoint.scalerValue ?? 4);
    setEnvVars([]);
    setError(null);
  }, [endpoint]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const env: Record<string, string> = {};
    for (const ev of envVars) {
      if (ev.key.trim()) {
        env[ev.key.trim()] = ev.value;
      }
    }

    setSubmitting(true);
    try {
      const result = await updateEndpointAction({
        endpointId: endpoint.id,
        name: name.trim() || undefined,
        workersMin,
        workersMax,
        idleTimeout,
        scalerType,
        scalerValue,
        env: Object.keys(env).length > 0 ? env : undefined,
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
        title={t("runpod.endpoints.edit.title", { name: endpoint.name ?? endpoint.id.slice(0, 8) })}
        description={t("runpod.endpoints.edit.description")}
        size="lg"
        footer={
          <Inline gap="sm" justify="end">
            <Button variant="secondary" type="button" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button loading={submitting} onClick={handleSubmit}>
              {t("runpod.common.saveChanges")}
            </Button>
          </Inline>
        }
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            {error && <Alert tone="danger" title={error} />}

            <Field label={t("runpod.common.name")} helper={t("runpod.endpoints.edit.nameHelper")}>
              <TextInput
                placeholder={endpoint.name ?? t("runpod.endpoints.edit.unnamedEndpoint")}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>

            <Divider label={t("runpod.endpoints.edit.dividerScaling")} />

            <Grid columns={2} gap="md">
              <Field label={t("runpod.endpoints.create.minWorkersLabel")}>
                <NumberInput value={workersMin} onChange={setWorkersMin} min={0} max={100} />
              </Field>
              <Field label={t("runpod.endpoints.create.maxWorkersLabel")}>
                <NumberInput value={workersMax} onChange={setWorkersMax} min={1} max={100} />
              </Field>
            </Grid>

            <Divider label={t("runpod.endpoints.edit.dividerTimeoutsScaling")} />

            <Grid columns={3} gap="md">
              <Field label={t("runpod.common.idleTimeout")} helper={t("runpod.endpoints.edit.idleTimeoutHelper")}>
                <NumberInput value={idleTimeout} onChange={setIdleTimeout} min={1} max={3600} />
              </Field>
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
                  {t("runpod.endpoints.edit.noNewEnvVars")}
                </Text>
              )}
            </Stack>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
