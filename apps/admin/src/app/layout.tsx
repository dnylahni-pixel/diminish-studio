import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, Vazirmatn } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { I18nProvider } from "@/i18n/client";
import { defaultLocale, dirForLocale, isLocale, type Locale } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const vazirmatn = Vazirmatn({ variable: "--font-vazir", subsets: ["latin", "arabic"] });

async function resolveLocale(): Promise<Locale> {
  const store = await cookies();
  const cookie = store.get("locale")?.value;
  return isLocale(cookie) ? cookie : defaultLocale;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const i18n = await getI18n(locale);
  return {
    title: i18n.t("meta.title"),
    description: i18n.t("meta.description"),
    alternates: {
      languages: { en: "/en", fa: "/fa" },
    },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await resolveLocale();

  return (
    <ClerkProvider>
      <html
        lang={locale}
        dir={dirForLocale(locale)}
        className={`${geistSans.variable} ${geistMono.variable} ${vazirmatn.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <I18nProvider locale={locale}>{children}</I18nProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
