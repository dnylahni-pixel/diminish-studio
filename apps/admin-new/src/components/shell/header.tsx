"use client";

import { Bell, Languages, Menu, Search } from "lucide-react";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
} from "@appica/ui-react/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@appica/ui-react/dropdown-menu";
import {
  LogOut,
  Settings,
  CircleUser,
  User,
} from "lucide-react";
import { ActionSwapButton } from "@/components/beui/motion/action-swap";
import {
  AnimatedSidebarTrigger,
  useAnimatedSidebar,
} from "@/components/beui/motion/animated-sidebar";
import { Button } from "@/components/beui/motion/button";
import { ThemeToggle } from "@/components/beui/motion/theme-toggle";
import { useLocale } from "@/components/providers/locale-provider";
import { translate, type Locale } from "@/i18n/shell";

export function Header() {
  const { locale, setLocale } = useLocale();
  const { open, openMobile } = useAnimatedSidebar();
  const sidebarExpanded = open || openMobile;

  return (
    <header className="border-border-muted bg-background/85 z-40 flex h-12 w-full shrink-0 items-center justify-between gap-2 border-b px-3 backdrop-blur-md">
      <div className="flex items-center gap-1">
        <AnimatedSidebarTrigger
          aria-label={translate(
            locale,
            sidebarExpanded ? "header.collapse" : "header.expand",
          )}
          className="text-foreground-muted hover:bg-primary/[0.06] hover:text-foreground"
        >
          <Menu className="size-5" />
        </AnimatedSidebarTrigger>

        <Button
          variant="ghost"
          size="icon"
          aria-label={translate(locale, "header.search")}
          className="text-foreground-muted hover:text-foreground"
        >
          <Search className="size-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <ActionSwapButton
          items={[
            {
              id: "fa",
              label: "فا",
              icon: <Languages className="size-4" />,
              ariaLabel: translate(locale, "header.language"),
            },
            {
              id: "en",
              label: "EN",
              icon: <Languages className="size-4" />,
              ariaLabel: translate(locale, "header.language"),
            },
          ]}
          value={locale}
          onValueChange={(value) => setLocale(value as Locale)}
          variant="ghost"
          size="icon"
          iconOnly
          animation="blur"
          className="text-foreground-muted hover:text-foreground"
        />

        <Button
          variant="ghost"
          size="icon"
          aria-label={translate(locale, "header.notifications")}
          className="text-foreground-muted hover:text-foreground"
        >
          <Bell className="size-4" />
        </Button>

        <ThemeToggle
          variant="rectangle"
          aria-label={translate(locale, "header.theme")}
          className="text-foreground-muted hover:bg-primary/[0.06] hover:text-foreground size-8 rounded-lg"
          iconClassName="size-4"
        />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label={translate(locale, "header.account")}
                className="text-foreground-muted hover:text-foreground"
              >
                <Avatar size="sm">
                  <AvatarFallback>
                    <User />
                  </AvatarFallback>
                  <AvatarBadge />
                </Avatar>
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <CircleUser data-icon="start" className="size-5" />
              {translate(locale, "menu.profile")}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings data-icon="start" className="size-5" />
              {translate(locale, "menu.settings")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut data-icon="start" className="size-5" />
              {translate(locale, "menu.signout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
