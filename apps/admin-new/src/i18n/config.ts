export const locales = ["en", "fa"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const isLocale = (value: string | undefined | null): value is Locale =>
  !!value && (locales as readonly string[]).includes(value);

export const isRtl = (locale: Locale) => locale === "fa";
export const dirForLocale = (locale: Locale): "ltr" | "rtl" => (isRtl(locale) ? "rtl" : "ltr");

/**
 * Prefix an internal href with the locale. Idempotent — safe to call with an
 * already-prefixed path. Leaves external (`http*`) and reserved (`/_*`) paths alone.
 */
export const localePrefix = (locale: Locale, href: string) => {
  if (!href.startsWith("/") || href.startsWith("/_")) return href;
  const first = href.split("/")[1];
  if (isLocale(first)) return href;
  return `/${locale}${href === "/" ? "" : href}`;
};

/** Strip the leading locale segment: `/en/users` -> `/users`, `/en` -> `/`. */
export const pathnameWithoutLocale = (pathname: string) => {
  const first = pathname.split("/")[1];
  return isLocale(first) ? pathname.slice(first.length + 1) || "/" : pathname;
};
