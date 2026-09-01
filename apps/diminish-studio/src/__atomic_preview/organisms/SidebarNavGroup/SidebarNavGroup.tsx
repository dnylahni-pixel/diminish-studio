/**
 * ORGANISM: SidebarNavGroup - لیست ناوبری (نسخه فایل اتمیک: padding 0 10px، gap 4)
 */
import { Theme, ThemeTokens, spacing, motion } from "../../tokens";
import { ICON_MAP } from "../../atoms/Icons/Icons";
import { NavItem } from "../../molecules/NavItem/NavItem";

type NavItemDef = { id: keyof typeof ICON_MAP; label: string };

const PRIMARY: NavItemDef[] = [
  { id: "Home", label: "Home" },
  { id: "Explore", label: "Explore" },
  { id: "Feed", label: "Feed" },
  { id: "Upload", label: "Upload" },
  { id: "Library", label: "Library" },
];

const SECONDARY: NavItemDef[] = [
  { id: "Settings", label: "Settings" },
  { id: "Support", label: "Support" },
];

type Props = {
  items: NavItemDef[];
  active: string;
  setActive: (id: string) => void;
  theme: Theme;
  variant: "desktop" | "mobile";
  mounted: boolean;
  tokens: ThemeTokens;
  group: "primary" | "secondary";
  startDelayDesktop: number;
  startDelayMobile: number;
};

export const SidebarNavGroup = ({ items, active, setActive, theme, variant, mounted, tokens, group, startDelayDesktop, startDelayMobile }: Props) => (
  <div style={{ display: "flex", flexDirection: "column", gap: spacing.navGap, padding: "0 10px" }}>
    {items.map((item, i) => {
      const delay = variant === "desktop" ? startDelayDesktop + i * motion.staggerPrimary : group === "primary" ? motion.mobilePrimary[i] : motion.mobileSecondary[i];
      return (
        <NavItem
          key={item.id}
          id={item.id}
          label={item.label}
          active={active === item.id}
          theme={theme}
          variant={variant}
          mounted={mounted}
          delay={delay}
          tokens={tokens}
          onClick={() => setActive(item.id)}
        />
      );
    })}
  </div>
);