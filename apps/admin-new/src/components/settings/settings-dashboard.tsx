"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@appica/ui-react/accordion";
import { Badge } from "@appica/ui-react/badge";
import { Button } from "@appica/ui-react/button";
import { Input } from "@appica/ui-react/input";
import { Spinner } from "@appica/ui-react/spinner";
import { useToastManager } from "@appica/ui-react/toast";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@appica/ui-react/alert";
import {
  Check,
  CircleCheck,
  CircleX,
  Cpu,
  Database,
  Gauge,
  Music,
  Route,
  Settings2,
  Shield,
  Tag,
  Upload,
} from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import type { SettingsGroup, SettingValue } from "@/db/schema";
import { saveSetting } from "@/features/settings/actions";
import type {
  SettingListItem,
  SettingsGroupData,
  SettingsListData,
} from "@/features/settings/types";
import { translate, type SettingsKey } from "@/i18n/settings";
import { SettingField } from "./setting-field";

type IconComponent = (props: {
  className?: string;
  "aria-hidden"?: boolean;
}) => ReactNode;

const GROUP_ICONS: Record<SettingsGroup, IconComponent> = {
  analyze: Cpu,
  upload: Upload,
  storage: Database,
  songs: Music,
  learning: Settings2,
  auth: Shield,
  player: Gauge,
  ui: Settings2,
  routes: Route,
  branding: Tag,
};

type ParseResult =
  | { ok: true; value: SettingValue }
  | { ok: false; error: string };

/**
 * Convert a draft (raw input strings for number/object fields) into the typed
 * value the server expects. Mirrors the server-side zod validation closely so
 * the user gets immediate feedback without an extra round-trip.
 */
function parseDraft(
  item: SettingListItem,
  draft: SettingValue,
  t: (key: SettingsKey) => string,
): ParseResult {
  switch (item.valueType) {
    case "boolean":
      return { ok: true, value: draft === true };
    case "number": {
      const raw = String(draft ?? "").trim();
      if (raw === "") return { ok: false, error: t("errors.invalidNumber") };
      const parsed = Number(raw);
      return Number.isFinite(parsed)
        ? { ok: true, value: parsed }
        : { ok: false, error: t("errors.invalidNumber") };
    }
    case "string":
      return { ok: true, value: String(draft ?? "") };
    case "string[]":
      return { ok: true, value: Array.isArray(draft) ? draft : [] };
    case "number[]": {
      const arr = Array.isArray(draft) ? (draft as number[]) : [];
      const nums = arr.map((n) => Number(n));
      return nums.some((n) => !Number.isFinite(n))
        ? { ok: false, error: t("errors.invalidNumber") }
        : { ok: true, value: nums };
    }
    case "object": {
      const record = (draft ?? {}) as Record<string, unknown>;
      if (item.key === "upload.rate_limit") {
        const max = Number(String(record.max ?? "").trim());
        const windowMs = Number(String(record.windowMs ?? "").trim());
        if (!Number.isFinite(max) || !Number.isFinite(windowMs)) {
          return { ok: false, error: t("errors.invalidRateLimit") };
        }
        return { ok: true, value: { max, windowMs } };
      }
      if (item.key === "ui.storage_warning_thresholds") {
        const warn = Number(String(record.warn ?? "").trim());
        const critical = Number(String(record.critical ?? "").trim());
        if (!Number.isFinite(warn) || !Number.isFinite(critical)) {
          return { ok: false, error: t("errors.invalidThresholds") };
        }
        return { ok: true, value: { warn, critical } };
      }
      return { ok: true, value: record };
    }
  }
}

function formatRelativeTime(
  iso: string,
  locale: "fa" | "en",
  justNow: string,
): string {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const absolute = Math.abs(seconds);
  if (absolute < 60) return justNow;

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const [unit, divisor] of units) {
    if (absolute >= divisor) {
      return formatter.format(Math.round(seconds / divisor), unit);
    }
  }
  return justNow;
}

interface Notice {
  text: string;
  tone: "success" | "error";
}

function SettingRow({ item }: { item: SettingListItem }) {
  const { locale } = useLocale();
  const router = useRouter();
  const toast = useToastManager();
  const t = (key: SettingsKey) => translate(locale, key);
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState<SettingValue>(() =>
    item.valueType === "number"
      ? String(item.value ?? item.defaultValue)
      : (item.value ?? item.defaultValue),
  );
  const [changeReason, setChangeReason] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);

  const handleSave = () => {
    const parsed = parseDraft(item, draft, t);
    if (!parsed.ok) {
      setNotice({ text: parsed.error, tone: "error" });
      return;
    }
    setNotice(null);
    startTransition(async () => {
      const result = await saveSetting(
        item.key,
        parsed.value,
        changeReason,
        locale,
      );
      if (result.status === "success") {
        setChangeReason("");
        router.refresh();
        toast.add({
          title: result.message,
          data: {
            icon: (
              <CircleCheck className="text-success-emphasis" />
            ),
          },
        });
        return;
      }
      toast.add({
        title: result.message,
        data: { icon: <CircleX className="text-error-emphasis" /> },
        priority: "high",
      });
    });
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-foreground-intense text-sm font-semibold">
            {t(`setting.${item.key}.label`)}
          </h3>
          <code className="text-foreground-muted font-mono text-xs">
            {item.key}
          </code>
        </div>
        <p className="text-foreground-muted mt-1 max-w-xl text-sm">
          {t(`setting.${item.key}.description`)}
        </p>
        <div className="text-foreground-muted mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span>
            {t("meta.version")}:{" "}
            {item.versionNumber !== null
              ? `v${item.versionNumber}`
              : t("meta.never")}
          </span>
          {item.updatedAt ? (
            <span>
              {t("meta.lastChanged")}:{" "}
              {formatRelativeTime(item.updatedAt, locale, t("meta.justNow"))}
            </span>
          ) : null}
          {item.updatedBy ? (
            <span>
              {t("meta.by")} {item.updatedBy}
            </span>
          ) : null}
          {item.value === null ? (
            <span>{t("meta.usesDefault")}</span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        <SettingField item={item} value={draft} onChange={setDraft} />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={changeReason}
            onChange={(event) => setChangeReason(event.target.value)}
            placeholder={t("actions.changeReasonPlaceholder")}
            className="sm:w-56"
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? (
              <Spinner currentColor className="text-[1.2em]" />
            ) : (
              <Check data-icon="start" className="size-4" />
            )}
            {t("actions.save")}
          </Button>
        </div>
        {notice ? (
          <p
            role={notice.tone === "error" ? "alert" : "status"}
            className={
              notice.tone === "error"
                ? "text-error text-xs"
                : "text-foreground-emphasis text-xs"
            }
          >
            {notice.text}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function GroupCard({ group }: { group: SettingsGroupData }) {
  const { locale } = useLocale();
  const t = (key: SettingsKey) => translate(locale, key);
  const [open, setOpen] = useState(true);
  const Icon = GROUP_ICONS[group.group];

  return (
    <Accordion
      variant="flush"
      value={open ? [group.group] : []}
      onValueChange={(value) =>
        setOpen((value as string[]).includes(group.group))
      }
      className="w-full overflow-hidden rounded-lg border border-border bg-background"
    >
      <AccordionItem value={group.group}>
        <AccordionTrigger className="gap-2 px-4 py-3.5 text-sm font-semibold text-foreground-intense">
          <span className="flex items-center gap-2">
            <Icon className="text-foreground-muted size-4" aria-hidden />
            {t(`groups.${group.group}` as SettingsKey)}
          </span>
          <Badge variant="outline">{group.items.length}</Badge>
        </AccordionTrigger>
        <AccordionContent>
          <div className="border-border-muted border-t">
            {group.items.map((item) => (
              <SettingRow key={item.key} item={item} />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

/**
 * Settings workspace — group settings by registry group (Accordion per group);
 * each row shows label + description + typed control + version/last-changed +
 * a save action. Mounted inside the Review Lab's Settings tab (not a final
 * route yet).
 */
export function SettingsDashboard({ data }: { data: SettingsListData }) {
  const { locale } = useLocale();
  const t = (key: SettingsKey) => translate(locale, key);
  const totalSettings = data.groups.reduce(
    (sum, group) => sum + group.items.length,
    0,
  );

  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-foreground-intense text-2xl font-bold">
              {t("page.title")}
            </h1>
            <Badge variant="outline">{totalSettings}</Badge>
          </div>
          <p className="text-foreground-muted mt-1 max-w-2xl text-sm">
            {t("page.subtitle")}
          </p>
        </div>
      </div>

      {data.movedCount > 0 ? (
        <Alert variant="info" className="mt-6">
          <AlertIcon>
            <Upload className="size-4" />
          </AlertIcon>
          <AlertTitle>{t("moved.title")}</AlertTitle>
          <AlertDescription>{t("moved.body")}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-6 flex flex-col gap-4">
        {data.groups.map((group) => (
          <GroupCard key={group.group} group={group} />
        ))}
      </div>
    </div>
  );
}
