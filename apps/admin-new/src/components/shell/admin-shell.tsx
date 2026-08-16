"use client";

import { type ReactNode } from "react";
import { useDirection } from "@appica/ui-react/hooks/use-direction";
import {
  AnimatedSidebar,
  AnimatedSidebarProvider,
} from "@/components/beui/motion/animated-sidebar";
import { useLocale } from "@/components/providers/locale-provider";
import { translate } from "@/i18n/shell";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

export function AdminShell({ children }: { children: ReactNode }) {
  const direction = useDirection();
  const { locale } = useLocale();

  return (
    <div className="bg-background text-foreground flex h-screen flex-col overflow-hidden">
      <AnimatedSidebarProvider defaultOpen className="h-full">
        <AnimatedSidebar
          side={direction === "rtl" ? "right" : "left"}
          collapsible="icon"
          ariaLabel={translate(locale, "sidebar.navigation")}
        >
          <Sidebar />
        </AnimatedSidebar>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Header />
          <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </AnimatedSidebarProvider>
    </div>
  );
}
