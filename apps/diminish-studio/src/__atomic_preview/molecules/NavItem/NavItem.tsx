/**
 * MOLECULE: NavItem - نسخه دقیق فایل اتمیک (14px، hover state، shine sweep)
 */
import { useState } from "react";
import { Theme, ThemeTokens, typography, spacing, radius, motion } from "../../tokens";
import { Indicator } from "../../atoms/Indicator/Indicator";
import { HoverShine } from "../../atoms/HoverShine/HoverShine";
import { ICON_MAP } from "../../atoms/Icons/Icons";

type NavItemProps = {
  id: keyof typeof ICON_MAP;
  label: string;
  active: boolean;
  theme: Theme;
  variant: "desktop" | "mobile";
  mounted: boolean;
  delay: number;
  tokens: ThemeTokens;
  onClick: () => void;
};

export const NavItem = ({ id, label, active, theme, variant, mounted, delay, tokens, onClick }: NavItemProps) => {
  const [hovered, setHovered] = useState(false);
  const Icon = ICON_MAP[id];

  return (
    <div
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateX(0)" : "translateX(-12px)",
        transition: `opacity 640ms ${motion.easing.lux} ${delay}ms, transform 640ms ${motion.easing.lux} ${delay}ms`,
      }}
    >
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="nav-item lux-ease w-full text-left relative overflow-hidden"
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing.navItem.gap,
          width: "100%",
          textAlign: "left",
          borderRadius: radius.nav,
          paddingLeft: spacing.navItem.px,
          paddingRight: spacing.navItem.px,
          paddingTop: spacing.navItem.py,
          paddingBottom: spacing.navItem.py,
          position: "relative",
          overflow: "hidden",
          background: active ? tokens.activeBg : hovered ? tokens.hoverBg : "transparent",
          color: active ? tokens.textPrimary : tokens.textMuted,
          border: `1px solid ${active ? tokens.borderColor : "transparent"}`,
          fontSize: typography.nav.size,
          fontWeight: typography.nav.weight,
          letterSpacing: "-0.01em",
          transition: `background 300ms ${motion.easing.lux}, color 300ms ${motion.easing.lux}, border-color 300ms ${motion.easing.lux}`,
          cursor: "pointer",
        }}
      >
        <Indicator active={active} color={tokens.textPrimary} />
        <span style={{ display: "flex", opacity: active ? 1 : 0.9 }}>
          <Icon active={active} />
        </span>
        <span style={{ flex: 1, lineHeight: 1 }}>{label}</span>
        <HoverShine theme={theme} />
      </button>
    </div>
  );
};