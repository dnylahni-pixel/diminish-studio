import type { ComponentType } from "react";
import {
  LayoutGrid,
  ChartColumn,
  FlaskConical,
  Boxes,
  Server,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import type { ShellKey } from "@/i18n/shell";

export type IconType = ComponentType<{
  className?: string;
  "aria-hidden"?: boolean;
}>;

export interface NavItem {
  href: string;
  labelKey: ShellKey;
  /** Optional short badge next to the item label — used to mark draft areas. */
  badgeKey?: ShellKey;
}

export interface NavGroup {
  key: string;
  labelKey: ShellKey;
  icon: IconType;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    key: "behavior",
    labelKey: "nav.behaviorGroup",
    icon: SlidersHorizontal,
    items: [{ href: "/behavior", labelKey: "nav.behavior" }],
  },
  {
    key: "workspace",
    labelKey: "nav.workspace",
    icon: LayoutGrid,
    items: [
      { href: "/", labelKey: "nav.overview" },
      { href: "/users", labelKey: "nav.users" },
    ],
  },
  {
    key: "monetization",
    labelKey: "nav.monetization",
    icon: Boxes,
    items: [
      { href: "/subscriptions", labelKey: "nav.subscriptions" },
      { href: "/plans", labelKey: "nav.plans" },
      { href: "/features", labelKey: "nav.features" },
      { href: "/credits", labelKey: "nav.credits" },
      { href: "/billing", labelKey: "nav.billing" },
      { href: "/promotions", labelKey: "nav.promotions" },
    ],
  },
  {
    key: "integrations",
    labelKey: "nav.integrations",
    icon: Server,
    items: [{ href: "/integrations/runpod", labelKey: "nav.runpod" }],
  },
  {
    key: "intelligence",
    labelKey: "nav.intelligence",
    icon: ChartColumn,
    items: [
      { href: "/reports", labelKey: "nav.reports" },
      { href: "/alerts", labelKey: "nav.alerts" },
    ],
  },
  {
    key: "system",
    labelKey: "nav.system",
    icon: ShieldCheck,
    items: [
      { href: "/admin", labelKey: "nav.admin" },
      { href: "/settings", labelKey: "nav.settings" },
    ],
  },
  {
    key: "lab",
    labelKey: "nav.lab",
    icon: FlaskConical,
    items: [
      { href: "/lab", labelKey: "nav.labArea", badgeKey: "nav.labBadge" },
    ],
  },
];
