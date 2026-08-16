"use client";

import { cn } from "@/lib/utils";
import { runpodNavDescriptor } from "@/integrations/runpod/contract";
import { LocalizedLink, useI18n, usePathnameWithoutLocale } from "@/i18n/client";

export function RunpodSubNav() {
  const pathname = usePathnameWithoutLocale();
  const { t } = useI18n();

  return (
    <div className="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-0 px-6">
      <nav className="flex gap-1 -mb-px overflow-x-auto">
        {runpodNavDescriptor.children.map((child) => {
          const isActive =
            child.href === "/integrations/runpod"
              ? pathname === child.href
              : pathname === child.href || pathname.startsWith(child.href + "/");

          return (
            <LocalizedLink
              key={child.href}
              href={child.href}
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap px-3 py-3 text-sm font-medium border-b-2 transition-colors",
                isActive
                  ? "border-primary-600 text-primary-700"
                  : "border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-300",
              )}
            >
              {t(`runpod.nav.${child.id}`)}
            </LocalizedLink>
          );
        })}
      </nav>
    </div>
  );
}
