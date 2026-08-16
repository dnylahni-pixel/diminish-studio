import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createT, type Messages, type TFunction } from "./translate";
import { defaultLocale, dirForLocale, isLocale, type Locale } from "./config";

const dictionaries = {
  en: () => import("@/messages/en.json").then((m) => m.default) as Promise<Messages>,
  fa: () => import("@/messages/fa.json").then((m) => m.default) as Promise<Messages>,
} as const;

export type I18n = {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: TFunction;
  messages: Messages;
};

export const getI18n = cache(async (locale: Locale): Promise<I18n> => {
  const messages = await dictionaries[locale]();
  return { locale, dir: dirForLocale(locale), t: createT(messages), messages };
});

/**
 * Resolve the active locale for a server render from the `locale` cookie
 * (set by the proxy). The app uses a rewrite-based locale strategy, so
 * server pages do NOT receive a `[lang]` segment — the cookie is the source
 * of truth. Use `await getServerI18n()` instead of reading `params.lang`.
 */
export const getServerLocale = cache(async (): Promise<Locale> => {
  const store = await cookies();
  const cookie = store.get("locale")?.value;
  return isLocale(cookie) ? cookie : defaultLocale;
});

export const getServerI18n = cache(async (): Promise<I18n> => {
  return getI18n(await getServerLocale());
});
