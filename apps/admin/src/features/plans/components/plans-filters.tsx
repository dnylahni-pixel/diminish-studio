"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/actions";
import { SearchInput } from "@/components/ui/inputs";
import { Select } from "@/components/ui/select-combobox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/selection";
import { Text } from "@/components/ui/typography";
import { useI18n, usePathnameWithoutLocale } from "@/i18n/client";
import { localePrefix } from "@/i18n/config";
import type { PlansFilters } from "../types";

interface PlansFiltersProps {
  filters: PlansFilters;
  currencies: string[];
}

export function PlansFilters({ filters, currencies }: PlansFiltersProps) {
  return (
    <PlansFiltersContent
      key={filters.q}
      filters={filters}
      currencies={currencies}
    />
  );
}

function PlansFiltersContent({ filters, currencies }: PlansFiltersProps) {
  const router = useRouter();
  const pathname = usePathnameWithoutLocale();
  const searchParams = useSearchParams();
  const { t, locale } = useI18n();
  const [search, setSearch] = useState(filters.q);
  const [isPending, startTransition] = useTransition();

  const replaceParams = useCallback(
    (updates: Record<string, string | undefined>, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }

      if (resetPage) params.delete("page");

      const query = params.toString();
      const target = localePrefix(locale, pathname);
      startTransition(() => {
        router.replace(query ? `${target}?${query}` : target, { scroll: false });
      });
    },
    [locale, pathname, router, searchParams],
  );

  useEffect(() => {
    if (search === filters.q) return;

    const timeout = window.setTimeout(() => {
      replaceParams({ q: search.trim() || undefined });
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [filters.q, replaceParams, search]);

  const hasActiveFilters =
    filters.q.length > 0 ||
    filters.status !== "all" ||
    filters.visibility !== "all" ||
    filters.currency !== "all" ||
    filters.sort !== "order" ||
    filters.direction !== "asc";

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Tabs
          value={filters.status}
          onValueChange={(value) =>
            replaceParams({ status: value === "all" ? undefined : value })
          }
        >
          <TabsList className="min-w-max">
            <TabsTrigger value="all">{t("plans.filters.allPlans")}</TabsTrigger>
            <TabsTrigger value="active">{t("plans.enums.active")}</TabsTrigger>
            <TabsTrigger value="draft">{t("plans.enums.draft")}</TabsTrigger>
            <TabsTrigger value="archived">{t("plans.enums.archived")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="min-w-0 flex-1 xl:max-w-md">
          <SearchInput
            size="sm"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch("")}
            placeholder={t("plans.filters.searchPlaceholder")}
            aria-label={t("plans.filters.searchAriaLabel")}
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:items-center">
          <div className="min-w-40">
            <Select
              size="sm"
              value={filters.visibility}
              onValueChange={(value) =>
                replaceParams({
                  visibility: value === "all" ? undefined : value,
                })
              }
              options={[
                { value: "all", label: t("plans.filters.allVisibility") },
                { value: "public", label: t("plans.filters.publicOnly") },
                { value: "private", label: t("plans.filters.privateOnly") },
              ]}
            />
          </div>
          <div className="min-w-40">
            <Select
              size="sm"
              value={filters.currency}
              onValueChange={(value) =>
                replaceParams({ currency: value === "all" ? undefined : value })
              }
              options={[
                { value: "all", label: t("plans.filters.allCurrencies") },
                ...currencies.map((currency) => ({
                  value: currency,
                  label: currency,
                })),
              ]}
            />
          </div>
          <div className="min-w-40">
            <Select
              size="sm"
              value={filters.sort}
              onValueChange={(value) => replaceParams({ sort: value })}
              options={[
                { value: "order", label: t("plans.filters.sortOrder") },
                { value: "name", label: t("plans.filters.sortName") },
                { value: "updated", label: t("plans.filters.sortUpdated") },
              ]}
            />
          </div>
          <div className="min-w-36">
            <Select
              size="sm"
              value={filters.direction}
              onValueChange={(value) => replaceParams({ direction: value })}
              options={[
                { value: "asc", label: t("plans.filters.ascending") },
                { value: "desc", label: t("plans.filters.descending") },
              ]}
            />
          </div>
        </div>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            leadingIcon={<RotateCcw className="size-3.5" />}
            onClick={() => {
              setSearch("");
              startTransition(() =>
                router.replace(localePrefix(locale, pathname), { scroll: false }),
              );
            }}
          >
            {t("plans.filters.reset")}
          </Button>
        )}
      </div>

      <div className="flex min-h-5 items-center justify-between gap-4">
        <Text size="xs" tone="subtle">
          {t("plans.filters.footnote")}
        </Text>
        <Text
          size="xs"
          tone="muted"
          className={isPending ? "visible" : "invisible"}
          aria-live="polite"
        >
          {t("plans.filters.updating")}
        </Text>
      </div>
    </div>
  );
}
