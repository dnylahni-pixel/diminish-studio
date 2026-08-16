"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-time";
import { Select } from "@/components/ui/select-combobox";
import { useI18n, usePathnameWithoutLocale } from "@/i18n/client";
import { localePrefix } from "@/i18n/config";

interface OverviewHeaderControlsProps {
  from: string;
  to: string;
  currency: string;
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function formatDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function OverviewHeaderControls({
  from,
  to,
  currency,
}: OverviewHeaderControlsProps) {
  const router = useRouter();
  const pathname = usePathnameWithoutLocale();
  const { locale } = useI18n();
  const searchParams = useSearchParams();

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }

    const query = params.toString();
    const target = localePrefix(locale, pathname);
    router.replace(query ? `${target}?${query}` : target, { scroll: false });
  };

  const handleDateChange = (range: DateRange | undefined) => {
    updateParams({
      from: range?.from ? formatDate(range.from) : undefined,
      to: range?.to ? formatDate(range.to) : undefined,
    });
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="min-w-64">
        <DateRangePicker
          value={{ from: parseDate(from), to: parseDate(to) }}
          onChange={handleDateChange}
          size="sm"
        />
      </div>
      <div className="w-full sm:w-32">
        <Select
          value={currency}
          onValueChange={(value) => updateParams({ currency: value })}
          size="sm"
          options={[
            { label: "USD", value: "USD" },
            { label: "EUR", value: "EUR" },
            { label: "GBP", value: "GBP" },
          ]}
        />
      </div>
    </div>
  );
}
