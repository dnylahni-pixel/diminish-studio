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
import { Button } from "@appica/ui-react/button";
import { Spinner } from "@appica/ui-react/spinner";
import { Check } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { updatePlan } from "@/features/plans/actions";
import type {
  PlanCrudActionState,
  PlanStatus,
  PlanWorkspaceItem,
} from "@/features/plans/types";
import { translate, type PlansKey } from "@/i18n/plans";

interface PlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: PlanWorkspaceItem;
  onSaved: (message: string) => void;
}

/**
 * Edit-only dialog for plan identity fields (name, description, visibility,
 * status). Creation lives in `PlanCreatePanel` on the Plans page.
 */
export function PlanFormDialog({
  open,
  onOpenChange,
  plan,
  onSaved,
}: PlanFormDialogProps) {
  const { locale } = useLocale();
  const t = (key: PlansKey) => translate(locale, key);

  const [name, setName] = useState(plan.name);
  const [code, setCode] = useState(plan.code);
  const [description, setDescription] = useState(plan.description ?? "");
  const [status, setStatus] = useState<PlanStatus>(plan.status);
  const [isPublic, setIsPublic] = useState(plan.isPublic);
  const [errors, setErrors] = useState<
    Record<string, string[] | undefined>
  >({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setName(plan.name);
    setCode(plan.code);
    setDescription(plan.description ?? "");
    setStatus(plan.status);
    setIsPublic(plan.isPublic);
    setErrors({});
    setServerError(null);
  }, [open, plan]);

  const validateEdit = () => {
    const nextErrors: Record<string, string[]> = {};
    if (name.trim().length < 2) nextErrors.name = [t("errors.nameShort")];
    return nextErrors;
  };

  const handleSave = () => {
    const nextErrors = validateEdit();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setServerError(null);
    startTransition(async () => {
      const result: PlanCrudActionState = await updatePlan({
        planId: plan.id,
        name,
        description,
        isPublic,
        status,
        locale,
      });
      if (result.status === "success") {
        onOpenChange(false);
        onSaved(result.message);
        return;
      }
      setErrors(result.fieldErrors ?? {});
      setServerError(result.message);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:w-200">
        <DialogHeader>
          <DialogTitle>{t("planForm.editTitle")}</DialogTitle>
          <DialogDescription>{t("planForm.editDescription")}</DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-5">
          <Field name="name" invalid={Boolean(errors.name?.[0])}>
            <FieldLabel>{t("planForm.nameLabel")}</FieldLabel>
            <Input
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("planForm.namePlaceholder")}
              aria-invalid={errors.name ? true : undefined}
              className="data-invalid:motion-safe:animate-shake"
            />
            <FieldError>{errors.name?.[0]}</FieldError>
          </Field>

          <Field name="code">
            <FieldLabel>{t("planForm.codeLabel")}</FieldLabel>
            <Input
              name="code"
              value={code}
              disabled
              className="font-mono"
            />
            <FieldDescription>
              {t("planForm.codeReadonlyHelper")}
            </FieldDescription>
          </Field>

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
                  <SelectItem value="draft">{t("status.draft")}</SelectItem>
                  <SelectItem value="active">{t("status.active")}</SelectItem>
                  <SelectItem value="archived">
                    {t("status.archived")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FieldDescription>
                {t("planForm.statusHelper")}
              </FieldDescription>
            </Field>
          </div>

          {serverError ? (
            <p className="text-error text-sm" role="alert">
              {serverError}
            </p>
          ) : null}
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
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
            {isPending ? t("actions.saving") : t("planForm.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
