"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Badge } from "@appica/ui-react/badge";
import {
  AnimatedSidebarContent,
  AnimatedSidebarFooter,
  AnimatedSidebarGroup,
  AnimatedSidebarHeader,
  AnimatedSidebarMenu,
  AnimatedSidebarMenuButton,
  AnimatedSidebarMenuItem,
  AnimatedSidebarMenuSub,
  AnimatedSidebarMenuSubButton,
  AnimatedSidebarMenuSubItem,
  useAnimatedSidebar,
} from "@/components/beui/motion/animated-sidebar";
import { useLocale } from "@/components/providers/locale-provider";
import { translate } from "@/i18n/shell";
import { cn } from "@/lib/beui-utils";
import { NAV_GROUPS } from "./nav";

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Sidebar() {
  const { locale } = useLocale();
  const pathname = usePathname();
  const { state, setOpen } = useAnimatedSidebar();
  const activeGroup =
    NAV_GROUPS.find((group) =>
      group.items.some((item) => isActivePath(pathname, item.href)),
    )?.key ?? "";
  const [openGroups, setOpenGroups] = useState<string[]>(
    activeGroup ? [activeGroup] : [],
  );

  useEffect(() => {
    if (!activeGroup) return;
    setOpenGroups((previous) =>
      previous.includes(activeGroup)
        ? previous
        : [...previous, activeGroup],
    );
  }, [activeGroup]);

  const toggleGroup = (key: string) => {
    if (state === "collapsed") setOpen(true);
    setOpenGroups((previous) =>
      previous.includes(key)
        ? previous.filter((group) => group !== key)
        : [...previous, key],
    );
  };

  return (
    <>
      <AnimatedSidebarHeader>
        <div className="flex items-center gap-2.5 px-1">
          <div
            className={cn(
              "bg-primary text-primary-foreground grid size-8 shrink-0 place-items-center rounded-xl text-sm font-bold",
            )}
            aria-hidden="true"
          >
            D
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-foreground-intense truncate text-sm font-semibold">
              Diminish
            </p>
            <p className="text-foreground-muted truncate text-[11px]">
              Admin v2
            </p>
          </div>
        </div>
      </AnimatedSidebarHeader>

      <AnimatedSidebarContent>
        {NAV_GROUPS.map((group) => {
          const Icon = group.icon;
          const isOpen = openGroups.includes(group.key);
          return (
            <AnimatedSidebarGroup key={group.key}>
              <AnimatedSidebarMenu>
                <AnimatedSidebarMenuItem>
                  <AnimatedSidebarMenuButton
                    icon={<Icon className="size-5" />}
                    ariaExpanded={isOpen}
                    onSelect={() => toggleGroup(group.key)}
                  >
                    {translate(locale, group.labelKey)}
                  </AnimatedSidebarMenuButton>
                  <AnimatedSidebarMenuSub open={isOpen}>
                    {group.items.map((item) => {
                      const active = isActivePath(pathname, item.href);
                      return (
                        <AnimatedSidebarMenuSubItem key={item.href}>
                          <AnimatedSidebarMenuSubButton
                            href={item.href}
                            isActive={active}
                          >
                            <span className="flex items-center gap-2">
                              <span>
                                {translate(locale, item.labelKey)}
                              </span>
                              {item.badgeKey ? (
                                <Badge variant="warning" size="xs">
                                  {translate(locale, item.badgeKey)}
                                </Badge>
                              ) : null}
                            </span>
                          </AnimatedSidebarMenuSubButton>
                        </AnimatedSidebarMenuSubItem>
                      );
                    })}
                  </AnimatedSidebarMenuSub>
                </AnimatedSidebarMenuItem>
              </AnimatedSidebarMenu>
            </AnimatedSidebarGroup>
          );
        })}
      </AnimatedSidebarContent>

      <AnimatedSidebarFooter>
        <p className="text-foreground-muted px-2 text-[11px]">
          {translate(locale, "sidebar.footer")}
        </p>
      </AnimatedSidebarFooter>
    </>
  );
}
