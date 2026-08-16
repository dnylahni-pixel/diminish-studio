"use client";

import { Switch } from "@appica/ui-react/switch";
import { Input } from "@appica/ui-react/input";
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
import { useLocale } from "@/components/providers/locale-provider";
import type { SettingValue } from "@/db/schema";
import type { SettingListItem } from "@/features/settings/types";
import { translate, type SettingsKey } from "@/i18n/settings";

export interface SettingFieldProps {
  item: SettingListItem;
  /**
   * The draft value. Conventions:
   * - `number` → the raw input string (parsed at save time);
   * - `object` → a `Record<string, unknown>` whose numeric sub-fields hold raw
   *   input strings (parsed at save time);
   * - everything else holds its typed value.
   */
  value: SettingValue;
  onChange: (value: SettingValue) => void;
}

/**
 * Renders the typed control for a setting's `valueType`:
 *   boolean → Switch
 *   number  → Input(type=number)
 *   string  → Input(text)
 *   string[]→ Combobox multi-select with chips (options = default ∪ current)
 *   number[]→ Combobox multi-select with chips (numbers, same option rule)
 *   object  → typed sub-form for the two known shapes — never a raw JSON editor
 */
export function SettingField({ item, value, onChange }: SettingFieldProps) {
  const { locale } = useLocale();
  const t = (key: SettingsKey) => translate(locale, key);

  switch (item.valueType) {
    case "boolean":
      return (
        <Switch
          checked={value === true}
          onCheckedChange={(checked) => onChange(checked === true)}
          name={item.key}
          aria-label={t(`setting.${item.key}.label`)}
        />
      );

    case "number":
      return (
        <Input
          type="number"
          name={item.key}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          className="w-44"
        />
      );

    case "string":
      return (
        <Input
          type="text"
          name={item.key}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          className="w-64"
        />
      );

    case "string[]": {
      const current = Array.isArray(value) ? value : [];
      const defaults = Array.isArray(item.defaultValue) ? item.defaultValue : [];
      const options = [...new Set([...current, ...defaults])];
      return (
        <div className="w-full sm:w-96">
          <Combobox
            items={options}
            multiple
            value={current}
            onValueChange={(next) => onChange(next as string[])}
            itemToStringLabel={(option) => String(option)}
            name={item.key}
          >
            <ComboboxChips placeholder={t("field.arrayPlaceholder")}>
              <ComboboxValue>
                {(selected: string[]) =>
                  selected.map((option) => (
                    <ComboboxChip key={option} aria-label={option}>
                      {option}
                    </ComboboxChip>
                  ))
                }
              </ComboboxValue>
            </ComboboxChips>
            <ComboboxContent>
              <ComboboxEmpty>{t("field.arrayEmpty")}</ComboboxEmpty>
              <ComboboxList>
                {(option: string) => (
                  <ComboboxItem key={option} value={option}>
                    <span className="flex-1">{option}</span>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
      );
    }

    case "number[]": {
      const current = Array.isArray(value) ? value.map(String) : [];
      const defaults = Array.isArray(item.defaultValue)
        ? item.defaultValue.map(String)
        : [];
      const options = [...new Set([...current, ...defaults])];
      return (
        <div className="w-full sm:w-96">
          <Combobox
            items={options}
            multiple
            value={current}
            onValueChange={(next) =>
              onChange((next as string[]).map((option) => Number(option)))
            }
            itemToStringLabel={(option) => String(option)}
            name={item.key}
          >
            <ComboboxChips placeholder={t("field.arrayPlaceholder")}>
              <ComboboxValue>
                {(selected: string[]) =>
                  selected.map((option) => (
                    <ComboboxChip key={option} aria-label={option}>
                      {option}
                    </ComboboxChip>
                  ))
                }
              </ComboboxValue>
            </ComboboxChips>
            <ComboboxContent>
              <ComboboxEmpty>{t("field.arrayEmpty")}</ComboboxEmpty>
              <ComboboxList>
                {(option: string) => (
                  <ComboboxItem key={option} value={option}>
                    <span className="flex-1">{option}</span>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
      );
    }

    case "object": {
      const record = (value ?? {}) as Record<string, unknown>;
      return <ObjectField item={item} record={record} onChange={onChange} />;
    }

    default:
      return null;
  }
}

function ObjectField({
  item,
  record,
  onChange,
}: {
  item: SettingListItem;
  record: Record<string, unknown>;
  onChange: (value: SettingValue) => void;
}) {
  const updateField = (field: string, raw: string) => {
    onChange({ ...record, [field]: raw });
  };

  if (item.key === "upload.rate_limit") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <code className="text-foreground-muted font-mono text-xs">max</code>
          <Input
            type="number"
            name={`${item.key}.max`}
            value={String(record.max ?? "")}
            onChange={(event) => updateField("max", event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <code className="text-foreground-muted font-mono text-xs">
            windowMs
          </code>
          <Input
            type="number"
            name={`${item.key}.windowMs`}
            value={String(record.windowMs ?? "")}
            onChange={(event) => updateField("windowMs", event.target.value)}
          />
        </label>
      </div>
    );
  }

  if (item.key === "ui.storage_warning_thresholds") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <code className="text-foreground-muted font-mono text-xs">warn</code>
          <Input
            type="number"
            name={`${item.key}.warn`}
            value={String(record.warn ?? "")}
            onChange={(event) => updateField("warn", event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <code className="text-foreground-muted font-mono text-xs">
            critical
          </code>
          <Input
            type="number"
            name={`${item.key}.critical`}
            value={String(record.critical ?? "")}
            onChange={(event) => updateField("critical", event.target.value)}
          />
        </label>
      </div>
    );
  }

  // No other object shapes exist in the closed registry.
  return null;
}
