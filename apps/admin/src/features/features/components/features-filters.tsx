"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/actions";
import { SearchInput } from "@/components/ui/inputs";
import { Select } from "@/components/ui/select-combobox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/selection";
import { Text } from "@/components/ui/typography";
import {
  useI18n,
  useLocale,
  usePathnameWithoutLocale,
} from "@/i18n/client";
import { localePrefix } from "@/i18n/config";
import type { FeaturesFilters as FeatureFiltersType } from "../types";

export function FeaturesFilters({
  filters,
}: {
  filters: FeatureFiltersType;
}) {
  const router = useRouter();
  const pathname = usePathnameWithoutLocale();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { t } = useI18n();
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
      startTransition(() => {
        router.replace(
          localePrefix(locale, query ? `${pathname}?${query}` : pathname),
          { scroll: false },
        );
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
    filters.kind !== "all" ||
    filters.policy !== "all" ||
    filters.sort !== "updated" ||
    filters.direction !== "desc";

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
            <TabsTrigger value="all">{t("features.filters.allFeatures")}</TabsTrigger>
            <TabsTrigger value="active">{t("features.active")}</TabsTrigger>
            <TabsTrigger value="inactive">{t("features.inactive")}</TabsTrigger>
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
            placeholder={t("features.filters.searchPlaceholder")}
            aria-label={t("features.filters.searchLabel")}
          />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:items-center">
          <div className="min-w-40">
            <Select
              size="sm"
              value={filters.kind}
              onValueChange={(value) =>
                replaceParams({ kind: value === "all" ? undefined : value })
              }
              options={[
                { value: "all", label: t("features.filters.allTypes") },
                { value: "boolean", label: t("features.kind.boolean") },
                { value: "metered", label: t("features.kind.metered") },
                { value: "quota", label: t("features.kind.quota") },
                { value: "package", label: t("features.kind.package") },
              ]}
            />
          </div>
          <div className="min-w-44">
            <Select
              size="sm"
              value={filters.policy}
              onValueChange={(value) =>
                replaceParams({ policy: value === "all" ? undefined : value })
              }
              options={[
                { value: "all", label: t("features.filters.allPostures") },
                { value: "open", label: t("features.filters.openPolicy") },
                { value: "restricted", label: t("features.filters.hasLimitPolicies") },
                { value: "metered", label: t("features.filters.meteredCapabilities") },
                { value: "unconfigured", label: t("features.filters.noPlanOverride") },
              ]}
            />
          </div>
          <div className="min-w-40">
            <Select
              size="sm"
              value={filters.sort}
              onValueChange={(value) => replaceParams({ sort: value })}
              options={[
                { value: "updated", label: t("features.filters.sortUpdated") },
                { value: "name", label: t("features.filters.sortName") },
                { value: "usage", label: t("features.filters.sortUsage") },
              ]}
            />
          </div>
          <div className="min-w-36">
            <Select
              size="sm"
              value={filters.direction}
              onValueChange={(value) => replaceParams({ direction: value })}
              options={[
                { value: "asc", label: t("features.filters.ascending") },
                { value: "desc", label: t("features.filters.descending") },
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
            {t("features.filters.reset")}
          </Button>
        )}
      </div>

      <div className="flex min-h-5 items-center justify-between gap-4">
        <Text size="xs" tone="subtle">
          {t("features.filters.urlNote")}
        </Text>
        <Text
          size="xs"
          tone="muted"
          className={isPending ? "visible" : "invisible"}
          aria-live="polite"
        >
          {t("features.filters.updating")}
        </Text>
      </div>
    </div>
  );
}
