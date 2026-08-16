import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono, Vazirmatn } from "next/font/google";
import { ThemeProvider } from "@appica/ui-react/providers/theme-provider";
import { ReducedMotionProvider } from "@appica/ui-react/providers/reduced-motion-provider";
import { ToastProvider, Toaster } from "@appica/ui-react/toast";
import { ClerkProvider } from "@clerk/nextjs";
import { LocaleProvider } from "@/components/providers/locale-provider";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const vazirmatn = Vazirmatn({ variable: "--font-vazir", subsets: ["latin", "arabic"] });

export const metadata: Metadata = {
  title: "Diminish Admin v2",
  description: "Admin UI rebuilt from scratch on Appica UI",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html
        lang="fa"
        dir="rtl"
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${vazirmatn.variable}`}
      >
        <body>
          <ThemeProvider>
            <LocaleProvider>
              <ReducedMotionProvider>
                <ToastProvider>
                  {children}
                  <Toaster position="bottom-right" />
                </ToastProvider>
              </ReducedMotionProvider>
            </LocaleProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
