"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/actions";
import { TextInput, NumberInput, Textarea, Field } from "@/components/ui/inputs";
import { Select } from "@/components/ui/select-combobox";
import { Switch } from "@/components/ui/form-controls";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/overlay";
import { Alert } from "@/components/ui/feedback";
import { Grid, Stack, Inline } from "@/components/ui/layout";
import { Text } from "@/components/ui/typography";
import { updateTemplateAction } from "@/integrations/runpod/server/mutations";
import type { TemplateSummary, ContainerRegistryAuthSummary } from "@/integrations/runpod/types";

/* ---------------------------------------------------------------------------
   Types
   --------------------------------------------------------------------------- */

interface TemplateEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TemplateSummary;
  registryAuths: ContainerRegistryAuthSummary[];
}

type EnvEntry = { key: string; value: string };

const TEMPLATE_CATEGORY_OPTIONS = [
  { value: "AI / Machine Learning", label: "AI / Machine Learning" },
  { value: "Deep Learning", label: "Deep Learning" },
  { value: "LLM", label: "LLM" },
  { value: "Stable Diffusion", label: "Stable Diffusion" },
  { value: "Text Generation", label: "Text Generation" },
  { value: "Development", label: "Development" },
  { value: "Custom", label: "Custom" },
  { value: "Gaming", label: "Gaming" },
  { value: "Other", label: "Other" },
];

/* ---------------------------------------------------------------------------
   Component
   --------------------------------------------------------------------------- */

export function TemplateEditDialog({ open, onOpenChange, template, registryAuths }: TemplateEditDialogProps) {
  const router = useRouter();

  /* ----- Form state ----- */
  const [name, setName] = useState(template.name ?? "");
  const [imageName, setImageName] = useState(template.imageName ?? "");
  const [category, setCategory] = useState(template.category ?? "");
  const [isServerless, setIsServerless] = useState(template.isServerless ?? false);
  const [containerDiskInGb, setContainerDiskInGb] = useState<number | undefined>(template.containerDiskInGb ?? undefined);
  const [volumeInGb, setVolumeInGb] = useState<number | undefined>(template.volumeInGb ?? undefined);
  const [volumeMountPath, setVolumeMountPath] = useState("");
  const [dockerEntrypoint, setDockerEntrypoint] = useState("");
  const [dockerStartCmd, setDockerStartCmd] = useState("");
  const [readme, setReadme] = useState("");
  const [containerRegistryAuthId, setContainerRegistryAuthId] = useState("");

  /* ----- Dynamic list state ----- */
  const [portEntries, setPortEntries] = useState<string[]>([""]);
  const [envEntries, setEnvEntries] = useState<EnvEntry[]>([{ key: "", value: "" }]);

  /* ----- Interaction state ----- */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ----- Re-initialize when template changes ----- */
  useEffect(() => {
    setName(template.name ?? "");
    setImageName(template.imageName ?? "");
    setCategory(template.category ?? "");
    setIsServerless(template.isServerless ?? false);
    setContainerDiskInGb(template.containerDiskInGb ?? undefined);
    setVolumeInGb(template.volumeInGb ?? undefined);
    setVolumeMountPath("");
    setDockerEntrypoint("");
    setDockerStartCmd("");
    setReadme("");
    setContainerRegistryAuthId("");
    setPortEntries([""]);
    setEnvEntries([{ key: "", value: "" }]);
    setError(null);
  }, [template.id, template.name, template.imageName, template.category, template.isServerless, template.containerDiskInGb, template.volumeInGb]);

  /* ----- Handlers ----- */

  function resetForm() {
    setName(template.name ?? "");
    setImageName(template.imageName ?? "");
    setCategory(template.category ?? "");
    setIsServerless(template.isServerless ?? false);
    setContainerDiskInGb(template.containerDiskInGb ?? undefined);
    setVolumeInGb(template.volumeInGb ?? undefined);
    setVolumeMountPath("");
    setDockerEntrypoint("");
    setDockerStartCmd("");
    setReadme("");
    setContainerRegistryAuthId("");
    setPortEntries([""]);
    setEnvEntries([{ key: "", value: "" }]);
    setError(null);
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  }

  /* ----- Port handlers ----- */
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

  /* ----- Env handlers ----- */
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

  /* ----- Submit ----- */
  async function handleSubmit() {
    setError(null);

    setLoading(true);

    // Build environment variables record
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

    // Build input — all fields are optional per updateTemplateInputSchema
    const input: Record<string, unknown> = {
      templateId: template.id,
    };

    if (name.trim() !== (template.name ?? "")) {
      input.name = name.trim() || undefined;
    }
    if (imageName.trim() !== (template.imageName ?? "")) {
      input.imageName = imageName.trim() || undefined;
    }
    if (category !== (template.category ?? "")) {
      input.category = category || undefined;
    }
    if (isServerless !== (template.isServerless ?? false)) {
      input.isServerless = isServerless;
    }
    if (containerDiskInGb !== undefined && containerDiskInGb !== (template.containerDiskInGb ?? undefined)) {
      input.containerDiskInGb = containerDiskInGb;
    }
    if (volumeInGb !== undefined && volumeInGb !== (template.volumeInGb ?? undefined)) {
      input.volumeInGb = volumeInGb;
    }
    if (volumeMountPath.trim()) {
      input.volumeMountPath = volumeMountPath.trim();
    }
    if (ports) {
      input.ports = ports;
    }

    // Only send env if entries were actually added
    const hasUserEnv = envEntries.some((e) => e.key.trim());
    if (hasUserEnv) {
      input.env = env;
    }

    if (readme.trim()) {
      input.readme = readme.trim();
    }

    if (containerRegistryAuthId) {
      input.containerRegistryAuthId = containerRegistryAuthId;
    }

    const result = await updateTemplateAction(input);
    setLoading(false);

    if (result.ok) {
      handleOpenChange(false);
      router.refresh();
    } else {
      setError(result.error.message);
    }
  }

  /* ----- Derived options ----- */
  const registryAuthOptions = registryAuths.map((a) => ({
    value: a.id,
    label: a.name ?? a.id.slice(0, 8),
  }));

  /* ----- Render ----- */
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        size="lg"
        title="Edit template"
        description="Update the template configuration. Only modified fields will be saved."
        footer={
          <Inline gap="sm">
            <DialogTrigger asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogTrigger>
            <Button variant="primary" loading={loading} onClick={handleSubmit}>
              Save changes
            </Button>
          </Inline>
        }
      >
        <Stack gap="md">
          {error && <Alert tone="danger" title="Error">{error}</Alert>}

          {/* Basic info */}
          <Field label="Name" htmlFor="edit-name" optional>
            <TextInput
              id="edit-name"
              placeholder="My template"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field label="Image name" htmlFor="edit-image" optional>
            <TextInput
              id="edit-image"
              placeholder="nvidia/cuda:12.1-base"
              value={imageName}
              onChange={(e) => setImageName(e.target.value)}
            />
          </Field>

          <Grid columns={2} gap="md">
            <Field label="Category" optional>
              <Select
                options={TEMPLATE_CATEGORY_OPTIONS}
                placeholder="Select category"
                value={category}
                onValueChange={setCategory}
              />
            </Field>

            <Field label="Is serverless" optional>
              <div className="flex items-center gap-3 pt-1.5">
                <Switch
                  checked={isServerless}
                  onCheckedChange={(checked: boolean) => setIsServerless(checked)}
                />
                <Text size="sm" tone="muted">
                  {isServerless ? "Serverless template" : "Standard template"}
                </Text>
              </div>
            </Field>
          </Grid>

          {/* Storage */}
          <Grid columns={2} gap="md">
            <Field label="Container disk (GB)" optional>
              <NumberInput
                min={1}
                max={9000}
                value={containerDiskInGb}
                onChange={setContainerDiskInGb}
                placeholder="Leave unchanged"
              />
            </Field>

            <Field label="Volume (GB)" optional>
              <NumberInput
                min={0}
                max={50000}
                value={volumeInGb}
                onChange={setVolumeInGb}
                placeholder="Leave unchanged"
              />
            </Field>
          </Grid>

          <Field label="Volume mount path" optional>
            <TextInput
              placeholder="/workspace"
              value={volumeMountPath}
              onChange={(e) => setVolumeMountPath(e.target.value)}
            />
          </Field>

          {/* Docker config */}
          <Grid columns={2} gap="md">
            <Field label="Docker entrypoint" optional>
              <TextInput
                placeholder="/bin/sh"
                value={dockerEntrypoint}
                onChange={(e) => setDockerEntrypoint(e.target.value)}
              />
            </Field>

            <Field label="Docker start command" optional>
              <TextInput
                placeholder="-c 'python app.py'"
                value={dockerStartCmd}
                onChange={(e) => setDockerStartCmd(e.target.value)}
              />
            </Field>
          </Grid>

          {/* Registry auth */}
          <Field label="Registry auth" optional>
            <Select
              options={registryAuthOptions}
              placeholder={registryAuths.length === 0 ? "No registry auths available" : "Select registry auth"}
              value={containerRegistryAuthId}
              onValueChange={setContainerRegistryAuthId}
            />
          </Field>

          {/* Ports */}
          <Stack gap="xs">
            <Inline justify="between" align="center">
              <Text weight="medium" size="sm">Container ports</Text>
              <Button variant="ghost" size="sm" leadingIcon={<Plus className="size-3.5" />} onClick={addPortRow}>
                Add port
              </Button>
            </Inline>
            {portEntries.map((port, index) => (
              <Inline key={index} gap="sm">
                <TextInput
                  className="flex-1"
                  placeholder="e.g. 8888/tcp or 8080/udp"
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
              <Text weight="medium" size="sm">Environment variables</Text>
              <Button variant="ghost" size="sm" leadingIcon={<Plus className="size-3.5" />} onClick={addEnvRow}>
                Add variable
              </Button>
            </Inline>
            {envEntries.map((entry, index) => (
              <Inline key={index} gap="sm">
                <TextInput
                  className="flex-1"
                  placeholder="KEY"
                  value={entry.key}
                  onChange={(e) => updateEnvKey(index, e.target.value)}
                />
                <TextInput
                  className="flex-[2]"
                  placeholder="Value"
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

          {/* Readme */}
          <Field label="Readme" optional>
            <Textarea
              placeholder="Describe the template purpose, usage instructions, and any notes…"
              value={readme}
              onChange={(e) => setReadme(e.target.value)}
              rows={5}
            />
          </Field>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
