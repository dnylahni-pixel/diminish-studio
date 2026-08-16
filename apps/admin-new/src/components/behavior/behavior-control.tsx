"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CircleCheck,
  Cpu,
  Database,
  Gauge,
  GraduationCap,
  Info,
  Lock,
  LockOpen,
  MessageSquareText,
  Music,
  Navigation,
  Palette,
  Plug,
  Shield,
  Tag,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react";
import { AnimatedBadge } from "@/components/beui/motion/animated-badge";
import { Button } from "@/components/beui/motion/button";
import { Input } from "@/components/beui/motion/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/beui/motion/select";
import { Switch } from "@/components/beui/motion/switch";
import { Tooltip } from "@/components/beui/motion/tooltip";
import { useLocale } from "@/components/providers/locale-provider";
import type { SettingsGroup, SettingValue } from "@/db/schema";
import type {
  BehaviorControlData,
  BehaviorLayer,
  BehaviorSectionData,
} from "@/features/behavior/types";
import { saveSetting } from "@/features/settings/actions";
import type {
  SettingListItem,
  SettingsGroupData,
} from "@/features/settings/types";
import {
  translate as settingsTranslate,
  type SettingsKey,
} from "@/i18n/settings";
import {
  translate as behaviorTranslate,
  type BehaviorKey,
} from "@/i18n/behavior";
import { cn } from "@/lib/beui-utils";

const GROUP_ICONS: Record<SettingsGroup, LucideIcon> = {
  analyze: Cpu,
  upload: Upload,
  storage: Database,
  songs: Music,
  learning: GraduationCap,
  auth: Shield,
  player: Gauge,
  ui: Palette,
  routes: Navigation,
  branding: Tag,
};

/** Display layer for each registry group (runtime source of the behavior). */
const GROUP_LAYER: Record<SettingsGroup, BehaviorLayer> = {
  analyze: "BE",
  upload: "BE",
  storage: "BE",
  songs: "BE",
  learning: "BE",
  auth: "BE",
  player: "BE",
  ui: "FE",
  routes: "FE",
  branding: "FE",
};

function PendingBadge() {
  const { locale } = useLocale();
  return (
    <AnimatedBadge status="warning" size="sm">
      {behaviorTranslate(locale, "status.scheduled")}
    </AnimatedBadge>
  );
}

function MiniTable({
  headers,
  children,
  aligns,
}: {
  headers: string[];
  children: ReactNode;
  aligns?: Array<"start" | "end">;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="text-foreground-muted border-b border-border text-xs">
            {headers.map((header, index) => (
              <th
                key={header}
                className={cn(
                  "px-4 py-2 font-medium",
                  aligns?.[index] === "end" ? "text-end" : "text-start",
                )}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

type ParseResult =
  | { ok: true; value: SettingValue }
  | { ok: false; error: string };

function parseDraft(item: SettingListItem, draft: SettingValue): ParseResult {
  switch (item.valueType) {
    case "boolean":
      return { ok: true, value: draft === true };
    case "number": {
      const raw = String(draft ?? "").trim();
      const parsed = Number(raw);
      return raw !== "" && Number.isFinite(parsed)
        ? { ok: true, value: parsed }
        : { ok: false, error: "invalid" };
    }
    case "string":
      return { ok: true, value: String(draft ?? "") };
    case "string[]": {
      const list = String(draft ?? "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
      return { ok: true, value: list };
    }
    case "number[]": {
      const parts = String(draft ?? "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
      const numbers = parts.map(Number);
      return numbers.some((entry) => !Number.isFinite(entry))
        ? { ok: false, error: "invalid" }
        : { ok: true, value: numbers };
    }
    case "object": {
      const record = (draft ?? {}) as Record<string, unknown>;
      if (item.key === "upload.rate_limit") {
        const max = Number(String(record.max ?? "").trim());
        const windowMs = Number(String(record.windowMs ?? "").trim());
        if (!Number.isFinite(max) || !Number.isFinite(windowMs)) {
          return { ok: false, error: "invalid" };
        }
        return { ok: true, value: { max, windowMs } };
      }
      if (item.key === "ui.storage_warning_thresholds") {
        const warn = Number(String(record.warn ?? "").trim());
        const critical = Number(String(record.critical ?? "").trim());
        if (!Number.isFinite(warn) || !Number.isFinite(critical)) {
          return { ok: false, error: "invalid" };
        }
        return { ok: true, value: { warn, critical } };
      }
      return { ok: true, value: record };
    }
  }
}

/** The raw draft shape (strings for number/object fields) for a row. */
function initialDraft(item: SettingListItem): SettingValue {
  const base = item.value ?? item.defaultValue;
  if (item.valueType === "number") return String(base);
  if (item.valueType === "string[]") return (base as string[]).join(", ");
  if (item.valueType === "number[]") return (base as number[]).join(", ");
  if (item.valueType === "object") {
    const record = { ...(base as Record<string, unknown>) };
    if (item.key === "upload.rate_limit") {
      record.max = String(record.max ?? "");
      record.windowMs = String(record.windowMs ?? "");
    }
    if (item.key === "ui.storage_warning_thresholds") {
      record.warn = String(record.warn ?? "");
      record.critical = String(record.critical ?? "");
    }
    return record;
  }
  return base;
}

/** Compare two draft values, treating stringified number fields as primitives. */
function draftsEqual(a: SettingValue, b: SettingValue): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((entry, index) => entry === b[index]);
  }
  if (
    typeof a === "object" &&
    a !== null &&
    typeof b === "object" &&
    b !== null &&
    !Array.isArray(a) &&
    !Array.isArray(b)
  ) {
    const left = a as Record<string, unknown>;
    const right = b as Record<string, unknown>;
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    return (
      leftKeys.length === rightKeys.length &&
      leftKeys.every((key) => left[key] === right[key])
    );
  }
  return false;
}

function ObjectControl({
  item,
  draft,
  onChange,
  disabled,
}: {
  item: SettingListItem;
  draft: SettingValue;
  onChange: (value: SettingValue) => void;
  disabled: boolean;
}) {
  const record = (draft ?? {}) as Record<string, unknown>;

  if (item.key === "upload.rate_limit") {
    return (
      <div className="flex w-44 items-end gap-2">
        <Input
          label="max"
          type="number"
          className="min-w-0 flex-1"
          classNames={{ label: "text-[11px]" }}
          value={String(record.max ?? "")}
          onChange={(value) => onChange({ ...record, max: value })}
          disabled={disabled}
        />
        <Input
          label="windowMs"
          type="number"
          className="min-w-0 flex-1"
          classNames={{ label: "text-[11px]" }}
          value={String(record.windowMs ?? "")}
          onChange={(value) => onChange({ ...record, windowMs: value })}
          disabled={disabled}
        />
      </div>
    );
  }

  if (item.key === "ui.storage_warning_thresholds") {
    return (
      <div className="flex w-44 items-end gap-2">
        <Input
          label="warn"
          type="number"
          className="min-w-0 flex-1"
          classNames={{ label: "text-[11px]" }}
          value={String(record.warn ?? "")}
          onChange={(value) => onChange({ ...record, warn: value })}
          disabled={disabled}
        />
        <Input
          label="critical"
          type="number"
          className="min-w-0 flex-1"
          classNames={{ label: "text-[11px]" }}
          value={String(record.critical ?? "")}
          onChange={(value) => onChange({ ...record, critical: value })}
          disabled={disabled}
        />
      </div>
    );
  }

  return null;
}

function SettingRow({
  item,
  value,
  dirty,
  onChange,
  layer,
}: {
  item: SettingListItem;
  value: SettingValue;
  dirty: boolean;
  onChange: (item: SettingListItem, value: SettingValue) => void;
  layer: BehaviorLayer;
}) {
  const { locale } = useLocale();
  const t = (key: SettingsKey) => settingsTranslate(locale, key);
  const bt = (key: BehaviorKey) => behaviorTranslate(locale, key);
  const [locked, setLocked] = useState(true);

  const label = t(`setting.${item.key}.label` as SettingsKey);
  const lockLabel = locked
    ? bt("lock.action.unlock")
    : bt("lock.action.lock");

  let control: ReactNode;
  if (item.valueType === "boolean") {
    control = (
      <Switch
        checked={value === true}
        onCheckedChange={(next) => onChange(item, next)}
        disabled={locked}
        ariaLabel={label}
      />
    );
  } else if (item.key === "ui.theme") {
    control = (
      <Select
        value={String(value ?? "classic")}
        onValueChange={(next) => onChange(item, next)}
        disabled={locked}
        className="w-44"
      >
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="classic">Classic</SelectItem>
          <SelectItem value="new">New</SelectItem>
        </SelectContent>
      </Select>
    );
  } else if (item.valueType === "object") {
    control = (
      <ObjectControl
        item={item}
        draft={value}
        onChange={(next) => onChange(item, next)}
        disabled={locked}
      />
    );
  } else {
    control = (
      <Input
        type={item.valueType === "number" ? "number" : "text"}
        value={String(value ?? "")}
        onChange={(next) => onChange(item, next)}
        disabled={locked}
        className="w-44"
        classNames={
          item.valueType === "number"
            ? { input: "tabular-nums" }
            : undefined
        }
      />
    );
  }

  return (
    <tr className={cn("hover:bg-background-subtle", dirty && "bg-warning/[0.04]")}>
      <td className="text-foreground-muted px-4 py-2 align-middle whitespace-nowrap text-xs">
        {bt(`layer.${layer.toLowerCase()}` as BehaviorKey)}
      </td>
      <td className="max-w-xs px-4 py-2 align-middle">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <h3 className="text-foreground-intense text-xs font-semibold">
              {label}
            </h3>
            <code className="text-foreground-muted font-mono text-[11px]">
              {item.key}
            </code>
          </div>
          <p className="text-foreground-muted mt-0.5 line-clamp-2 text-[11px]">
            {t(`setting.${item.key}.description` as SettingsKey)}
          </p>
        </div>
      </td>
      <td className="px-4 py-2 align-middle">
        <div className="flex items-center">{control}</div>
      </td>
      <td className="px-4 py-2 align-middle whitespace-nowrap">
        {dirty ? (
          <AnimatedBadge status="warning" size="sm">
            {bt("staged.pending")}
          </AnimatedBadge>
        ) : (
          <AnimatedBadge status="success" size="sm">
            {bt("status.connected")}
          </AnimatedBadge>
        )}
      </td>
      <td className="px-4 py-2 align-middle text-end">
        <Tooltip content={lockLabel}>
          <Button
            variant="ghost"
            size="icon"
            aria-label={lockLabel}
            aria-pressed={locked}
            onClick={() => setLocked((next) => !next)}
          >
            {locked ? (
              <Lock className="size-4" />
            ) : (
              <LockOpen className="size-4" />
            )}
          </Button>
        </Tooltip>
      </td>
    </tr>
  );
}

function GroupRows({
  group,
  drafts,
  dirtyKeys,
  onChange,
}: {
  group: SettingsGroupData;
  drafts: Record<string, SettingValue>;
  dirtyKeys: Set<string>;
  onChange: (item: SettingListItem, value: SettingValue) => void;
}) {
  const { locale } = useLocale();
  const Icon = GROUP_ICONS[group.group];

  return (
    <>
      <tr className="bg-primary/[0.06]">
        <th
          colSpan={5}
          scope="colgroup"
          className="px-4 py-2 text-start"
        >
          <span className="text-foreground-intense flex items-center gap-2 text-xs font-semibold">
            <Icon className="text-primary size-3.5" />
            {settingsTranslate(
              locale,
              `groups.${group.group}` as SettingsKey,
            )}
            <span className="text-foreground-muted font-normal">
              {group.items.length}
            </span>
          </span>
        </th>
      </tr>
      {group.items.map((item) => (
        <SettingRow
          key={item.key}
          item={item}
          value={drafts[item.key] ?? initialDraft(item)}
          dirty={dirtyKeys.has(item.key)}
          onChange={onChange}
          layer={GROUP_LAYER[group.group]}
        />
      ))}
    </>
  );
}

function PendingRows({ section }: { section: BehaviorSectionData }) {
  const { locale } = useLocale();
  const t = (key: BehaviorKey) => behaviorTranslate(locale, key);
  const Icon = section.key === "content" ? MessageSquareText : Plug;
  const titleKey: BehaviorKey =
    section.key === "content" ? "content.title" : "integrations.title";
  const descriptionKey: BehaviorKey =
    section.key === "content"
      ? "content.description"
      : "integrations.description";

  return (
    <>
      <tr className="bg-primary/[0.06]">
        <th colSpan={5} scope="colgroup" className="px-4 py-2 text-start">
          <span className="text-foreground-intense flex items-center gap-2 text-xs font-semibold">
            <Icon className="text-primary size-3.5" />
            {t(titleKey)}
          </span>
          <span className="text-foreground-muted mt-0.5 block text-[11px] font-normal">
            {t(descriptionKey)}
          </span>
        </th>
      </tr>
      {section.items.map((item) => (
        <tr key={item.code} className="hover:bg-background-subtle">
          <td className="px-4 py-2 text-xs">
            {t(`layer.${item.layer.toLowerCase()}` as BehaviorKey)}
          </td>
          <td className="px-4 py-2 font-mono text-xs">{item.code}</td>
          <td className="text-foreground-muted px-4 py-2 text-xs">
            {item.value}
          </td>
          <td className="px-4 py-2">
            <PendingBadge />
          </td>
          <td className="px-4 py-2" />
        </tr>
      ))}
    </>
  );
}

export function BehaviorControl({ data }: { data: BehaviorControlData }) {
  const { locale } = useLocale();
  const router = useRouter();
  const t = (key: BehaviorKey) => behaviorTranslate(locale, key);
  const [drafts, setDrafts] = useState<Record<string, SettingValue>>({});
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [isApplying, startTransition] = useTransition();

  const itemByKey = useMemo(() => {
    const map = new Map<string, SettingListItem>();
    for (const group of data.settings.groups) {
      for (const item of group.items) map.set(item.key, item);
    }
    return map;
  }, [data.settings.groups]);

  const handleChange = (item: SettingListItem, next: SettingValue) => {
    setNotice(null);
    setDrafts((previous) => ({ ...previous, [item.key]: next }));
    setDirtyKeys((previous) => {
      const updated = new Set(previous);
      if (draftsEqual(next, initialDraft(item))) {
        updated.delete(item.key);
      } else {
        updated.add(item.key);
      }
      return updated;
    });
  };

  const applyChanges = () => {
    setNotice(null);
    const entries = [...dirtyKeys]
      .map((key) => {
        const item = itemByKey.get(key);
        return item
          ? { item, value: drafts[key] ?? initialDraft(item) }
          : null;
      })
      .filter((entry): entry is { item: SettingListItem; value: SettingValue } =>
        entry !== null,
      );
    if (entries.length === 0) return;

    const parsed: Array<{ item: SettingListItem; value: SettingValue }> = [];
    for (const entry of entries) {
      const result = parseDraft(entry.item, entry.value);
      if (!result.ok) {
        setNotice({
          tone: "error",
          text: `${t("staged.invalid")} ${entry.item.key}`,
        });
        return;
      }
      parsed.push({ item: entry.item, value: result.value });
    }

    startTransition(async () => {
      const results = await Promise.all(
        parsed.map(({ item, value }) =>
          saveSetting(item.key, value, "behavior control", locale),
        ),
      );
      if (results.every((result) => result.status === "success")) {
        setDrafts({});
        setDirtyKeys(new Set());
        setNotice({ tone: "success", text: t("staged.applied") });
        router.refresh();
      } else {
        setNotice({ tone: "error", text: t("staged.failed") });
      }
    });
  };

  const discardChanges = () => {
    setDrafts({});
    setDirtyKeys(new Set());
    setNotice(null);
  };

  const totalKeys = data.settings.groups.reduce(
    (sum, group) => sum + group.items.length,
    0,
  );
  const dirtyCount = dirtyKeys.size;
  const showActionBar = dirtyCount > 0 || notice !== null;

  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-foreground-intense text-xl font-semibold">
                {t("page.title")}
              </h1>
              <p className="text-foreground-muted mt-1 text-sm">
                {t("page.subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AnimatedBadge status="success" size="sm">
                {t("page.badgeLive")}
              </AnimatedBadge>
              <AnimatedBadge status="neutral" size="sm">
                {totalKeys}
              </AnimatedBadge>
            </div>
          </div>

          {showActionBar ? (
            <div className="border-warning/30 bg-warning/[0.06] sticky top-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 backdrop-blur">
              <div className="flex flex-wrap items-center gap-2">
                <AnimatedBadge status="warning" size="sm" contentKey={dirtyCount}>
                  {dirtyCount} {t("staged.pending")}
                </AnimatedBadge>
                {notice ? (
                  <p
                    role={notice.tone === "error" ? "alert" : "status"}
                    className={cn(
                      "text-xs",
                      notice.tone === "error"
                        ? "text-error"
                        : "text-success-emphasis",
                    )}
                  >
                    {notice.text}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={discardChanges}
                  disabled={isApplying}
                >
                  <X className="size-3.5" />
                  {t("staged.discard")}
                </Button>
                <Button
                  size="sm"
                  onClick={applyChanges}
                  disabled={isApplying || dirtyCount === 0}
                >
                  {isApplying ? (
                    <CircleCheck className="size-3.5" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                  {t(isApplying ? "staged.applying" : "staged.apply")}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="border-info/20 bg-info-subtle text-info-emphasis flex items-start gap-3 rounded-2xl border p-4">
            <Info className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="text-sm font-semibold">{t("banner.title")}</p>
              <p className="mt-0.5 text-xs opacity-80">{t("banner.body")}</p>
            </div>
          </div>
        </header>

        <div className="border-border overflow-hidden rounded-2xl border bg-background">
          <MiniTable
            headers={[
              t("table.colLayer"),
              t("table.colName"),
              t("table.colValue"),
              t("table.colStatus"),
              t("table.colActions"),
            ]}
            aligns={["start", "start", "start", "start", "end"]}
          >
            {data.settings.groups.map((group) => (
              <GroupRows
                key={group.group}
                group={group}
                drafts={drafts}
                dirtyKeys={dirtyKeys}
                onChange={handleChange}
              />
            ))}
            {data.pending.map((section) => (
              <PendingRows key={section.key} section={section} />
            ))}
          </MiniTable>
        </div>
      </div>
    </div>
  );
}
