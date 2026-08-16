"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createContainerRegistryAuthAction } from "@/integrations/runpod/server/mutations";
import { Button } from "@/components/ui/actions";
import { TextInput, PasswordInput, Field } from "@/components/ui/inputs";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/overlay";
import { Alert } from "@/components/ui/feedback";
import { Plus } from "lucide-react";
import { useI18n } from "@/i18n/client";

interface RegistryAuthCreateDialogProps {
  onSuccess?: () => void;
}

export function RegistryAuthCreateDialog({ onSuccess }: RegistryAuthCreateDialogProps = {}) {
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const resetForm = React.useCallback(() => {
    setName("");
    setUsername("");
    setPassword("");
    setError(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createContainerRegistryAuthAction({
      name,
      username,
      password,
    });

    if (!result.ok) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    // Success — close dialog, reset form, revalidate
    setOpen(false);
    resetForm();
    setLoading(false);
    onSuccess?.();
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          resetForm();
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button leadingIcon={<Plus className="size-4" />}>
          {t("runpod.registryAuths.create.button")}
        </Button>
      </DialogTrigger>
      <DialogContent
        title={t("runpod.registryAuths.create.title")}
        description={t("runpod.registryAuths.create.description")}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <Alert tone="danger" title={t("runpod.registryAuths.errorTitle")}>
              {error}
            </Alert>
          )}

          <Field label={t("runpod.common.name")} required>
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("runpod.registryAuths.create.namePlaceholder")}
              required
              disabled={loading}
            />
          </Field>

          <Field label={t("runpod.registryAuths.create.username")} required>
            <TextInput
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("runpod.registryAuths.create.usernamePlaceholder")}
              required
              disabled={loading}
            />
          </Field>

          <Field label={t("runpod.registryAuths.create.password")} required>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </Field>

          <div className="mt-6 flex justify-end gap-2.5">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" loading={loading}>
              {t("runpod.registryAuths.create.button")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
