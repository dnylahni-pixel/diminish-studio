"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/actions";
import { TextInput, NumberInput, Field } from "@/components/ui/inputs";
import { Select } from "@/components/ui/select-combobox";
import { Dialog, DialogContent } from "@/components/ui/overlay";
import { Alert } from "@/components/ui/feedback";
import { Grid, Stack, Inline } from "@/components/ui/layout";
import { Text } from "@/components/ui/typography";
import { createPodAction } from "@/integrations/runpod/server/mutations";
import {
  RUNPOD_GPU_TYPE_OPTIONS,
  RUNPOD_CPU_FLAVOR_OPTIONS,
  RUNPOD_DATA_CENTER_OPTIONS,
  localizeReferenceOptions,
} from "@/integrations/runpod/reference-data";
import { useI18n } from "@/i18n/client";
import type { TemplateSummary, ContainerRegistryAuthSummary } from "@/integrations/runpod/types";

/* ---------------------------------------------------------------------------
   Types
   --------------------------------------------------------------------------- */

interface PodCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: TemplateSummary[];
  registryAuths: ContainerRegistryAuthSummary[];
}

type EnvEntry = { key: string; value: string };

/* ---------------------------------------------------------------------------
   Component
   --------------------------------------------------------------------------- */

export function PodCreateDialog({ open, onOpenChange, templates, registryAuths }: PodCreateDialogProps) {
  const { t } = useI18n();

  /* ----- Form state ----- */
  const [name, setName] = useState("");
  const [imageName, setImageName] = useState("");
  const [computeType, setComputeType] = useState("GPU");
  const [cloudType, setCloudType] = useState("SECURE");
  const [gpuType, setGpuType] = useState("");
  const [gpuCount, setGpuCount] = useState<number | undefined>(undefined);
  const [cpuFlavor, setCpuFlavor] = useState("");
  const [containerDiskInGb, setContainerDiskInGb] = useState<number>(50);
  const [volumeInGb, setVolumeInGb] = useState<number | undefined>(undefined);
  const [volumeMountPath, setVolumeMountPath] = useState("");
  const [dataCenter, setDataCenter] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [containerRegistryAuthId, setContainerRegistryAuthId] = useState("");
  const [envEntries, setEnvEntries] = useState<EnvEntry[]>([{ key: "", value: "" }]);
  const [portEntries, setPortEntries] = useState<string[]>([""]);

  /* ----- Interaction state ----- */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ----- Handlers ----- */

  function resetForm() {
    setName("");
    setImageName("");
    setComputeType("GPU");
    setCloudType("SECURE");
    setGpuType("");
    setGpuCount(undefined);
    setCpuFlavor("");
    setContainerDiskInGb(50);
    setVolumeInGb(undefined);
    setVolumeMountPath("");
    setDataCenter("");
    setTemplateId("");
    setContainerRegistryAuthId("");
    setEnvEntries([{ key: "", value: "" }]);
    setPortEntries([""]);
    setError(null);
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  }

  function addEnvRow() {
    setEnvEntries([...envEntries, { key: "", value: "" }]);
  }

  function removeEnvRow(index: number) {
    if (envEntries.length > 1) {
      setEnvEntries(envEntries.filter((_, i) => i !== index));
    }
  }

  function updateEnvKey(index: number, key: string) {
    const updated = envEntries.map((entry, i) => (i === index ? { ...entry, key } : entry));
    setEnvEntries(updated);
  }

  function updateEnvValue(index: number, value: string) {
    const updated = envEntries.map((entry, i) => (i === index ? { ...entry, value } : entry));
    setEnvEntries(updated);
  }

  function addPortRow() {
    setPortEntries([...portEntries, ""]);
  }

  function removePortRow(index: number) {
    if (portEntries.length > 1) {
      setPortEntries(portEntries.filter((_, i) => i !== index));
    }
  }

  function updatePort(index: number, value: string) {
    const updated = portEntries.map((p, i) => (i === index ? value : p));
    setPortEntries(updated);
  }

  async function handleSubmit() {
    setError(null);

    // Validate required fields
    if (!imageName.trim()) {
      setError(t("runpod.pods.create.errors.imageRequired"));
      return;
    }

    setLoading(true);

    // Build env record from non-empty key entries
    const env: Record<string, string> = {};
    for (const entry of envEntries) {
      if (entry.key.trim()) {
        env[entry.key.trim()] = entry.value;
      }
    }

    // Build ports string from non-empty entries
    const ports = portEntries
      .map((p) => p.trim())
      .filter(Boolean)
      .join(",");

    const input = {
      name: name.trim() || undefined,
      imageName: imageName.trim(),
      computeType,
      cloudType,
      gpuTypeIds: gpuType ? [gpuType] : undefined,
      gpuCount: gpuCount ?? undefined,
      cpuFlavorIds: cpuFlavor ? [cpuFlavor] : undefined,
      containerDiskInGb,
      volumeInGb: volumeInGb ?? undefined,
      volumeMountPath: volumeMountPath.trim() || undefined,
      dataCenterIds: dataCenter ? [dataCenter] : undefined,
      templateId: templateId || undefined,
      containerRegistryAuthId: containerRegistryAuthId || undefined,
      env,
      ports: ports || undefined,
    };

    const result = await createPodAction(input);
    setLoading(false);

    if (result.ok) {
      handleOpenChange(false);
    } else {
      setError(result.error.message);
    }
  }

  /* ----- Derived options ----- */
  const templateOptions = templates.map((template) => ({
    value: template.id,
    label: template.name ?? template.id.slice(0, 8),
  }));

  const registryAuthOptions = registryAuths.map((a) => ({
    value: a.id,
    label: a.name ?? a.id.slice(0, 8),
  }));

  /* ----- Render ----- */
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        size="lg"
        title={t("runpod.pods.create.title")}
        description={t("runpod.pods.create.description")}
        footer={
          <Inline gap="sm">
            <Button variant="secondary" onClick={() => handleOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" loading={loading} onClick={handleSubmit}>
              {t("runpod.common.create")}
            </Button>
          </Inline>
        }
      >
        <Stack gap="md">
          {error && <Alert tone="danger" title={t("runpod.pods.errorTitle")}>{error}</Alert>}

          {/* Basic info */}
          <Field label={t("runpod.common.name")} htmlFor="create-name" optional>
            <TextInput
              id="create-name"
              placeholder={t("runpod.pods.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field label={t("runpod.pods.imageName")} htmlFor="create-image" required>
            <TextInput
              id="create-image"
              placeholder="nvidia/cuda:12.1-base"
              value={imageName}
              onChange={(e) => setImageName(e.target.value)}
            />
          </Field>

          <Grid columns={2} gap="md">
            <Field label={t("runpod.pods.create.computeType")}>
              <Select
                options={[
                  { value: "GPU", label: "GPU" },
                  { value: "CPU", label: "CPU" },
                ]}
                value={computeType}
                onValueChange={setComputeType}
              />
            </Field>

            <Field label={t("runpod.pods.create.cloudType")}>
              <Select
                options={[
                  { value: "SECURE", label: t("runpod.pods.create.secureCloud") },
                  { value: "COMMUNITY", label: t("runpod.pods.create.communityCloud") },
                ]}
                value={cloudType}
                onValueChange={setCloudType}
              />
            </Field>
          </Grid>

          {/* Hardware */}
          <Grid columns={2} gap="md">
            <Field label={t("runpod.pods.create.gpuType")} optional>
              <Select
                options={RUNPOD_GPU_TYPE_OPTIONS}
                placeholder={t("runpod.pods.create.gpuTypePlaceholder")}
                value={gpuType}
                onValueChange={setGpuType}
              />
            </Field>

            <Field label={t("runpod.common.gpuCount")} optional>
              <NumberInput
                min={1}
                max={8}
                value={gpuCount}
                onChange={setGpuCount}
                placeholder="1"
              />
            </Field>
          </Grid>

          <Grid columns={2} gap="md">
            <Field label={t("runpod.pods.create.vcpuFlavor")} optional>
              <Select
                options={localizeReferenceOptions(RUNPOD_CPU_FLAVOR_OPTIONS, t)}
                placeholder={t("runpod.pods.create.cpuFlavorPlaceholder")}
                value={cpuFlavor}
                onValueChange={setCpuFlavor}
              />
            </Field>

            <Field label={t("runpod.pods.create.containerDisk")}>
              <NumberInput
                min={1}
                max={9000}
                value={containerDiskInGb}
                onChange={setContainerDiskInGb}
              />
            </Field>
          </Grid>

          <Grid columns={2} gap="md">
            <Field label={t("runpod.pods.create.volume")} optional>
              <NumberInput
                min={0}
                max={50000}
                value={volumeInGb}
                onChange={setVolumeInGb}
                placeholder={t("runpod.common.optional")}
              />
            </Field>

            <Field label={t("runpod.common.volumeMountPath")} optional>
              <TextInput
                placeholder="/workspace"
                value={volumeMountPath}
                onChange={(e) => setVolumeMountPath(e.target.value)}
              />
            </Field>
          </Grid>

          {/* Network & location */}
          <Field label={t("runpod.common.dataCenter")} optional>
            <Select
              options={localizeReferenceOptions(RUNPOD_DATA_CENTER_OPTIONS, t)}
              placeholder={t("runpod.common.selectDataCenter")}
              value={dataCenter}
              onValueChange={setDataCenter}
            />
          </Field>

          <Field label={t("runpod.common.template")} optional>
            <Select
              options={templateOptions}
              placeholder={templates.length === 0 ? t("runpod.pods.create.noTemplates") : t("runpod.pods.create.selectTemplate")}
              value={templateId}
              onValueChange={setTemplateId}
            />
          </Field>

          <Field label={t("runpod.common.registryAuth")} optional>
            <Select
              options={registryAuthOptions}
              placeholder={registryAuths.length === 0 ? t("runpod.common.noRegistryAuths") : t("runpod.common.selectRegistryAuth")}
              value={containerRegistryAuthId}
              onValueChange={setContainerRegistryAuthId}
            />
          </Field>

          {/* Ports */}
          <Stack gap="xs">
            <Inline justify="between" align="center">
              <Text weight="medium" size="sm">{t("runpod.common.containerPorts")}</Text>
              <Button variant="ghost" size="sm" leadingIcon={<Plus className="size-3.5" />} onClick={addPortRow}>
                {t("runpod.common.addPort")}
              </Button>
            </Inline>
            {portEntries.map((port, index) => (
              <Inline key={index} gap="sm">
                <TextInput
                  className="flex-1"
                  placeholder={t("runpod.pods.create.portPlaceholder")}
                  value={port}
                  onChange={(e) => updatePort(index, e.target.value)}
                />
                {portEntries.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-neutral-400 hover:text-danger-600"
                    onClick={() => removePortRow(index)}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </Inline>
            ))}
          </Stack>

          {/* Environment variables */}
          <Stack gap="xs">
            <Inline justify="between" align="center">
              <Text weight="medium" size="sm">{t("runpod.common.environmentVariables")}</Text>
              <Button variant="ghost" size="sm" leadingIcon={<Plus className="size-3.5" />} onClick={addEnvRow}>
                {t("runpod.common.addVariable")}
              </Button>
            </Inline>
            {envEntries.map((entry, index) => (
              <Inline key={index} gap="sm">
                <TextInput
                  className="flex-1"
                  placeholder={t("runpod.common.envKey")}
                  value={entry.key}
                  onChange={(e) => updateEnvKey(index, e.target.value)}
                />
                <TextInput
                  className="flex-[2]"
                  placeholder={t("runpod.common.envValue")}
                  value={entry.value}
                  onChange={(e) => updateEnvValue(index, e.target.value)}
                />
                {envEntries.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-neutral-400 hover:text-danger-600"
                    onClick={() => removeEnvRow(index)}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </Inline>
            ))}
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
