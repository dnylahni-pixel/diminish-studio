"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { DirectionProvider } from "@appica/ui-react/providers/direction-provider";
import { useLocalStorage } from "@appica/ui-react/hooks/use-local-storage";
import type { Locale } from "@/i18n/shell";

interface LocaleContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale | ((previous: Locale) => Locale)) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useLocalStorage<Locale>("admin.locale", "fa");
  const dir: "ltr" | "rtl" = locale === "fa" ? "rtl" : "ltr";

  useEffect(() => {
    const html = document.documentElement;
    html.lang = locale;
    html.dir = dir;
  }, [dir, locale]);

  return (
    <LocaleContext.Provider value={{ locale, dir, setLocale }}>
      <DirectionProvider dir={dir}>{children}</DirectionProvider>
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used inside <LocaleProvider>");
  }
  return context;
}
