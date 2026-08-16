"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import en from "@/messages/en.json";
import fa from "@/messages/fa.json";
import { createT, type MessageKey, type Messages } from "./translate";
import { dirForLocale, localePrefix, pathnameWithoutLocale, type Locale } from "./config";

// fa must structurally match en — enforced by the Record<Locale, Messages> type.
const dictionaries: Record<Locale, Messages> = { en, fa };

type I18nContextValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = React.createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const value = React.useMemo<I18nContextValue>(
    () => ({ locale, dir: dirForLocale(locale), t: createT(dictionaries[locale]) }),
    [locale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

export const useLocale = () => useI18n().locale;

export function LocalizedLink(props: React.ComponentPropsWithoutRef<typeof Link>) {
  const { locale } = useI18n();
  const { href, ...rest } = props;
  return <Link {...rest} href={typeof href === "string" ? localePrefix(locale, href) : href} />;
}

/** Current pathname with the leading locale segment stripped (`/en/users` -> `/users`). */
export function usePathnameWithoutLocale() {
  return pathnameWithoutLocale(usePathname());
}
