"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BadgePercent,
  BarChart3,
  Bell,
  Boxes,
  Coins,
  CreditCard,
  HelpCircle,
  Layers3,
  LayoutDashboard,
  ReceiptText,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { IconButton } from "@/components/ui/actions";
import { Avatar, Badge } from "@/components/ui/data-display";
import { LayoutSeparator, ScrollArea } from "@/components/ui/layout";
import { NavItem } from "@/components/ui/navigation";
import { Caption, Heading, Text } from "@/components/ui/typography";
import { useI18n, usePathnameWithoutLocale } from "@/i18n/client";
import { localePrefix } from "@/i18n/config";
import type { MessageKey } from "@/i18n/translate";

const navItemClassName =
  "max-md:justify-center max-md:px-0 max-md:[&>span:nth-child(2)]:hidden";

type AdminNavItem = {
  href: string;
  labelKey: MessageKey;
  icon: LucideIcon;
};

type AdminNavGroup = {
  labelKey: MessageKey;
  items: AdminNavItem[];
};

const navigationGroups: AdminNavGroup[] = [
  {
    labelKey: "nav.workspace",
    items: [
      { href: "/", labelKey: "nav.overview", icon: LayoutDashboard },
      { href: "/users", labelKey: "nav.users", icon: Users },
    ],
  },
  {
    labelKey: "nav.monetization",
    items: [
      { href: "/subscriptions", labelKey: "nav.subscriptions", icon: CreditCard },
      { href: "/plans", labelKey: "nav.plans", icon: Layers3 },
      { href: "/features", labelKey: "nav.features", icon: Boxes },
      { href: "/credits", labelKey: "nav.credits", icon: Coins },
      { href: "/billing", labelKey: "nav.billing", icon: ReceiptText },
      { href: "/promotions", labelKey: "nav.promotions", icon: BadgePercent },
    ],
  },
  {
    labelKey: "nav.integrations",
    items: [{ href: "/integrations/runpod", labelKey: "nav.runpod", icon: Server }],
  },
  {
    labelKey: "nav.intelligence",
    items: [
      { href: "/reports", labelKey: "nav.reports", icon: BarChart3 },
      { href: "/alerts", labelKey: "nav.alerts", icon: Bell },
    ],
  },
  {
    labelKey: "nav.system",
    items: [
      { href: "/admin", labelKey: "nav.adminSecurity", icon: ShieldCheck },
      { href: "/settings", labelKey: "nav.settings", icon: Settings },
    ],
  },
];

const navigationItems = navigationGroups.flatMap((group) => group.items);

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathnameWithoutLocale();
  const { t, locale } = useI18n();
  const activeItem = navigationItems.find((item) => isActivePath(pathname, item.href));
  const pageTitle = t(activeItem?.labelKey ?? "nav.overview");

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <aside className="flex w-[17.5rem] shrink-0 flex-col border-s border-neutral-200 bg-neutral-0 max-md:w-[4.75rem]">
        <div className="flex h-[4.5rem] shrink-0 items-center gap-3 px-5 max-md:justify-center max-md:px-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary-600 text-sm font-bold text-neutral-0 shadow-[var(--shadow-sm)]">
            D
          </div>
          <div className="min-w-0 max-md:hidden">
            <Text as="div" size="sm" weight="bold" className="leading-tight text-neutral-900">
              Diminish
            </Text>
            <Text as="div" size="xs" tone="muted" className="mt-0.5 leading-tight">
              {t("nav.superAdmin")}
            </Text>
          </div>
        </div>

        <LayoutSeparator />

        <ScrollArea className="min-h-0 flex-1">
          <nav className="space-y-6 px-3 py-5 max-md:px-2" aria-label={t("nav.mainNavLabel")}>
            {navigationGroups.map((group) => (
              <div key={group.labelKey} className="space-y-1">
                <Caption className="mb-2 block px-3 max-md:hidden">{t(group.labelKey)}</Caption>
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavItem
                      key={item.href}
                      href={localePrefix(locale, item.href)}
                      active={isActivePath(pathname, item.href)}
                      icon={<Icon className="size-4" />}
                      className={navItemClassName}
                    >
                      {t(item.labelKey)}
                    </NavItem>
                  );
                })}
              </div>
            ))}
          </nav>
        </ScrollArea>

        <div className="shrink-0">
          <LayoutSeparator />
          <div className="p-3">
            <NavItem icon={<HelpCircle className="size-4" />} className={navItemClassName}>
              {t("nav.helpSupport")}
            </NavItem>
          </div>
          <LayoutSeparator />
          <div className="flex items-center gap-3 p-4 max-md:justify-center max-md:px-0">
            <Avatar fallback="DA" size="sm" />
            <div className="min-w-0 flex-1 max-md:hidden">
              <Text as="div" size="sm" weight="semibold" className="truncate text-neutral-900">
                {t("nav.diminishAdmin")}
              </Text>
              <Text as="div" size="xs" tone="muted" className="truncate">
                {t("nav.platformOwner")}
              </Text>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[4.5rem] shrink-0 items-center justify-between border-b border-neutral-200 bg-neutral-0 px-6 max-md:px-4">
          <div>
            <Heading level={5}>{pageTitle}</Heading>
            <Text size="xs" tone="muted" className="mt-0.5 max-sm:hidden">
              {t("nav.workspaceDescription")}
            </Text>
          </div>

          <div className="flex items-center gap-2">
            <Badge tone="success" className="me-1 max-sm:hidden">
              {t("nav.systemOnline")}
            </Badge>
            <IconButton label={t("nav.searchLabel")} variant="ghost" size="sm">
              <Search className="size-4" />
            </IconButton>
            <IconButton label={t("nav.notificationsLabel")} variant="ghost" size="sm">
              <Bell className="size-4" />
            </IconButton>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
