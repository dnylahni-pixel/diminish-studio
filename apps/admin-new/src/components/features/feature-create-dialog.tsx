"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@appica/ui-react/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@appica/ui-react/select";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@appica/ui-react/combobox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@appica/ui-react/field";
import { Input } from "@appica/ui-react/input";
import { Textarea } from "@appica/ui-react/textarea";
import { Switch } from "@appica/ui-react/switch";
import { Checkbox } from "@appica/ui-react/checkbox";
import { Button } from "@appica/ui-react/button";
import { Spinner } from "@appica/ui-react/spinner";
import { useToastManager } from "@appica/ui-react/toast";
import { Check, CircleCheck } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { createFeature, updateFeature } from "@/features/features/actions";
import type {
  FeatureActionState,
  FeatureEditData,
} from "@/features/features/types";
import { translate, type FeaturesKey } from "@/i18n/features";
import { cn } from "@/lib/utils";
import { KIND_OPTIONS, kindIcon } from "./kind";
import type { FeatureKind, FeatureOption } from "./types";

const CODE_PATTERN = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
const UNIT_MAX = 80;

type FieldErrors = Partial<Record<"name" | "code" | "unitName", string>>;
type PendingAction = "create" | "cancel" | null;

function slugifyCode(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

interface FeatureCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableFeatures: FeatureOption[];
  editingFeature?: FeatureEditData | null;
}

export function FeatureCreateDialog({
  open,
  onOpenChange,
  availableFeatures,
  editingFeature = null,
}: FeatureCreateDialogProps) {
  const { locale } = useLocale();
  const router = useRouter();
  const toast = useToastManager();
  const t = (key: FeaturesKey) => translate(locale, key);

  const [kind, setKind] = useState<FeatureKind>("boolean");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [unitName, setUnitName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [defaultActive, setDefaultActive] = useState(true);
  const [dependencies, setDependencies] = useState<FeatureOption[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isPending, startTransition] = useTransition();

  const showUnit = kind === "metered" || kind === "quota";

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    if (editingFeature) {
      setKind(editingFeature.kind);
      setName(editingFeature.name);
      setCode(editingFeature.code);
      setCodeTouched(true);
      setDescription(editingFeature.description ?? "");
      setUnitName(editingFeature.unitName ?? "");
      setIsActive(editingFeature.isActive);
      setDefaultActive(editingFeature.defaultAccess === "allow");
      setDependencies(
        editingFeature.dependencyIds
          .map((id) =>
            availableFeatures.find((feature) => feature.id === id),
          )
          .filter((feature): feature is FeatureOption => feature !== undefined),
      );
      setErrors({});
    } else {
      setKind("boolean");
      setName("");
      setCode("");
      setCodeTouched(false);
      setDescription("");
      setUnitName("");
      setIsActive(true);
      setDefaultActive(true);
      setDependencies([]);
      setErrors({});
    }
  }, [open, editingFeature, availableFeatures]);

  const updateName = (value: string) => {
    setName(value);
    if (!codeTouched) setCode(slugifyCode(value));
  };

  const validate = (): FieldErrors => {
    const nextErrors: FieldErrors = {};
    if (name.trim().length < 2) nextErrors.name = t("errors.nameShort");
    if (code.trim().length < 2 || !CODE_PATTERN.test(code)) {
      nextErrors.code = t("errors.codeInvalid");
    }
    if (showUnit && unitName.length > UNIT_MAX) {
      nextErrors.unitName = t("errors.unitLong");
    }
    return nextErrors;
  };

  const requestCreate = () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      setPendingAction("create");
      setConfirmOpen(true);
    }
  };

  const requestCancel = () => {
    setPendingAction("cancel");
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    if (pendingAction === "create") {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("code", code);
      formData.set("description", description);
      formData.set("kind", kind);
      formData.set("unitName", showUnit ? unitName : "");
      formData.set("isActive", isActive ? "on" : "off");
      formData.set("defaultAccess", defaultActive ? "allow" : "deny");
      formData.set("metadataJson", "");
      formData.set("locale", locale);
      for (const dependency of dependencies) {
        formData.append("dependencyIds", dependency.id);
      }

      const initialState: FeatureActionState = {
        status: "idle",
        message: "",
        fieldErrors: {},
      };

      setServerError(null);
      startTransition(async () => {
        const result = editingFeature
          ? await updateFeature(editingFeature.id, initialState, formData)
          : await createFeature(initialState, formData);
        if (result.status === "success") {
          setKind("boolean");
          setName("");
          setCode("");
          setCodeTouched(false);
          setDescription("");
          setUnitName("");
          setIsActive(true);
          setDefaultActive(true);
          setDependencies([]);
          setErrors({});
          setPendingAction(null);
          onOpenChange(false);
          router.refresh();
          toast.add({
            title: result.message,
            data: {
              icon: <CircleCheck className="text-success-emphasis" />,
            },
          });
          return;
        }
        setServerError(result.message);
        setConfirmOpen(false);
        setPendingAction(null);
      });
    } else {
      onOpenChange(false);
    }
    setPendingAction(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:w-200">
          <DialogHeader>
            <DialogTitle>
              {editingFeature ? t("form.editTitle") : t("form.title")}
            </DialogTitle>
            <DialogDescription>
              {editingFeature
                ? t("form.editDescription")
                : t("form.description")}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="flex flex-col gap-5">
            <div className={cn("grid gap-4", showUnit && "sm:grid-cols-2")}>
              <Field name="kind">
                <FieldLabel>{t("kind.title")}</FieldLabel>
                <Select
                  value={kind}
                  onValueChange={(value) => setKind(value as FeatureKind)}
                >
                  <SelectTrigger aria-label={t("kind.title")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KIND_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="flex items-center gap-2">
                            <Icon className="size-4 text-foreground-muted" aria-hidden />
                            {t(option.labelKey)}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FieldDescription>{t("kind.description")}</FieldDescription>
              </Field>
              {showUnit && (
                <div className="ds-fade-in">
              <Field name="unitName" invalid={Boolean(errors.unitName)}>
                <FieldLabel>{t("unit.label")}</FieldLabel>
                <Input
                  name="unitName"
                  value={unitName}
                  onChange={(event) => setUnitName(event.target.value)}
                  placeholder={t("unit.placeholder")}
                  aria-invalid={errors.unitName ? true : undefined}
                  className="data-invalid:motion-safe:animate-shake"
                />
                <FieldDescription>{t("unit.helper")}</FieldDescription>
                <FieldError>{errors.unitName}</FieldError>
              </Field>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="name" invalid={Boolean(errors.name)}>
                <FieldLabel>{t("basic.nameLabel")}</FieldLabel>
                <Input
                  name="name"
                  value={name}
                  onChange={(event) => updateName(event.target.value)}
                  placeholder={t("basic.namePlaceholder")}
                  aria-invalid={errors.name ? true : undefined}
                  className="data-invalid:motion-safe:animate-shake"
                />
                <FieldError>{errors.name}</FieldError>
              </Field>
              <Field name="code" invalid={Boolean(errors.code)}>
                <FieldLabel>{t("basic.codeLabel")}</FieldLabel>
                <Input
                  name="code"
                  value={code}
                  onChange={(event) => {
                    setCodeTouched(true);
                    setCode(slugifyCode(event.target.value));
                  }}
                  placeholder={t("basic.namePlaceholder")}
                  aria-invalid={errors.code ? true : undefined}
                  className="data-invalid:motion-safe:animate-shake"
                />
                <FieldDescription>{t("basic.codeHelper")}</FieldDescription>
                <FieldError>{errors.code}</FieldError>
              </Field>
            </div>

            <Field name="description">
              <FieldLabel>{t("basic.descriptionLabel")}</FieldLabel>
              <Textarea
                name="description"
                rows={3}
                maxLength={1000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t("basic.descriptionPlaceholder")}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-4 select-none">
                <span className="flex flex-col">
                  <span className="text-foreground-intense text-sm font-medium">
                    {t("policy.activeLabel")}
                  </span>
                  <span className="text-foreground-muted text-xs">
                    {t("policy.activeHelper")}
                  </span>
                </span>
                <Switch checked={isActive} onCheckedChange={setIsActive} name="isActive" />
              </label>
              <label className="flex items-start gap-2.5 rounded-lg border border-border p-4 select-none">
                <Checkbox
                  checked={defaultActive}
                  onCheckedChange={setDefaultActive}
                  className="mt-1"
                  name="defaultAccess"
                />
                <span className="flex flex-col">
                  <span className="text-foreground-intense text-sm font-medium">
                    {t("access.defaultLabel")}
                  </span>
                  <span className="text-foreground-muted text-xs">
                    {t("access.defaultHelper")}
                  </span>
                </span>
              </label>
            </div>

            {!editingFeature && (
              <div className="space-y-2">
                <Field name="dependencyIds">
                  <FieldLabel>{t("deps.label")}</FieldLabel>
                  <FieldDescription>{t("deps.helper")}</FieldDescription>
                </Field>
                <Combobox
                  items={availableFeatures}
                  multiple
                  value={dependencies}
                  onValueChange={(value) =>
                    setDependencies(value as FeatureOption[])
                  }
                  itemToStringLabel={(item) => (item as FeatureOption).name}
                  name="dependencyIds"
                >
                  <ComboboxChips placeholder={t("deps.placeholder")}>
                    <ComboboxValue>
                      {(selected: FeatureOption[]) =>
                        selected.map((feature) => (
                          <ComboboxChip
                            key={feature.id}
                            aria-label={feature.name}
                          >
                            {feature.name}
                          </ComboboxChip>
                        ))
                      }
                    </ComboboxValue>
                  </ComboboxChips>
                  <ComboboxContent>
                    <ComboboxEmpty>{t("deps.empty")}</ComboboxEmpty>
                    <ComboboxList>
                      {(item: FeatureOption) => {
                        const Icon = kindIcon(item.kind);
                        return (
                          <ComboboxItem key={item.id} value={item}>
                            <span className="bg-background-muted text-foreground-muted flex size-6 shrink-0 items-center justify-center rounded-md">
                              <Icon className="size-3.5" aria-hidden />
                            </span>
                            <span className="flex-1">{item.name}</span>
                            <span className="text-foreground-muted text-xs">
                              {item.code}
                            </span>
                          </ComboboxItem>
                        );
                      }}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
            )}
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={requestCancel}>
              {t("submit.cancel")}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={requestCreate}
              disabled={isPending}
            >
              {isPending ? (
                <Spinner currentColor className="text-[1.2em]" />
              ) : (
                <Check data-icon="start" className="size-4" />
              )}
              {editingFeature ? t("submit.save") : t("submit.create")}
            </Button>
          </DialogFooter>
          {serverError && (
            <p className="text-error px-6 pb-4 text-sm" role="alert">
              {serverError}
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* دیالوگ تأیید — برای ساخت و برای لغو */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction === "create"
                ? t("dialog.confirmCreate")
                : t("dialog.confirmCancel")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction === "create"
                ? t("dialog.confirmCreateBody")
                : t("dialog.confirmCancelBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost">{t("dialog.back")}</Button>} />
            <Button
              variant={pendingAction === "cancel" ? "destructive" : "primary"}
              onClick={handleConfirm}
            >
              {t("dialog.confirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
