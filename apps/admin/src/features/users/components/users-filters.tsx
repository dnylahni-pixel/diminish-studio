"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/actions";
import { DateInput } from "@/components/ui/date-time";
import { SearchInput } from "@/components/ui/inputs";
import { Select } from "@/components/ui/select-combobox";
import { Text } from "@/components/ui/typography";
import type { UsersFilters as UsersFiltersState } from "../list-types";

export function UsersFilters({
  filters,
  plans,
}: {
  filters: UsersFiltersState;
  plans: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (search === filters.q) return;
    const timeout = window.setTimeout(
      () => replaceParams({ q: search.trim() || undefined }),
      350,
    );
    return () => window.clearTimeout(timeout);
  }, [filters.q, replaceParams, search]);

  const hasActiveFilters =
    filters.q.length > 0 ||
    filters.subscription !== "all" ||
    filters.plan !== "all" ||
    filters.from.length > 0 ||
    filters.to.length > 0 ||
    filters.sort !== "createdAt" ||
    filters.direction !== "desc";

  return (
    <div className={isPending ? "space-y-4 opacity-70" : "space-y-4"}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="min-w-0 flex-1 xl:max-w-md">
          <SearchInput
            size="sm"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch("")}
            placeholder="Search user ID, username or email"
            aria-label="Search users"
          />
        </div>
        <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Select
            size="sm"
            value={filters.subscription}
            onValueChange={(value) =>
              replaceParams({
                subscription: value === "all" ? undefined : value,
              })
            }
            options={[
              { value: "all", label: "All subscription states" },
              { value: "active", label: "Active" },
              { value: "trialing", label: "Trialing" },
              { value: "past_due", label: "Past due" },
              { value: "paused", label: "Paused" },
              { value: "canceled", label: "Canceled" },
              { value: "expired", label: "Expired" },
              { value: "none", label: "No subscription" },
            ]}
          />
          <Select
            size="sm"
            value={filters.plan}
            onValueChange={(value) =>
              replaceParams({ plan: value === "all" ? undefined : value })
            }
            options={[
              { value: "all", label: "All plans" },
              ...plans.map((plan) => ({ value: plan.id, label: plan.name })),
            ]}
          />
          <Select
            size="sm"
            value={filters.sort}
            onValueChange={(value) => replaceParams({ sort: value })}
            options={[
              { value: "createdAt", label: "Sort: joined date" },
              { value: "username", label: "Sort: username" },
              { value: "creditBalance", label: "Sort: available credit" },
            ]}
          />
          <Select
            size="sm"
            value={filters.direction}
            onValueChange={(value) => replaceParams({ direction: value })}
            options={[
              { value: "desc", label: "Descending" },
              { value: "asc", label: "Ascending" },
            ]}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <DateInput
            size="sm"
            value={filters.from}
            onChange={(event) =>
              replaceParams({ from: event.target.value || undefined })
            }
            aria-label="Joined from"
          />
          <DateInput
            size="sm"
            value={filters.to}
            onChange={(event) =>
              replaceParams({ to: event.target.value || undefined })
            }
            aria-label="Joined to"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Text size="xs" tone="subtle">
            Search and filters are persisted in the URL.
          </Text>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leadingIcon={<RotateCcw className="size-3.5" />}
              onClick={() => {
                setSearch("");
                startTransition(() => router.replace(pathname, { scroll: false }));
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
