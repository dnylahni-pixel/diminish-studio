/**
 * MOLECULE: ThemeSwitcher - نسخه فایل اتمیک (pill با blur 8px، رنگ inactive متفاوت)
 */
import type { ReactNode } from "react";
import { Theme, ThemeTokens, spacing, radius, motion } from "../../tokens";
import { IconSun, IconMoon } from "../../atoms/Icons/Icons";

type Props = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  variant: "desktop" | "mobile";
  mounted: boolean;
  tokens: ThemeTokens;
};

const ThemeButton = ({
  active,
  theme,
  icon,
  onClick,
  label,
}: {
  active: boolean;
  theme: Theme;
  icon: ReactNode;
  onClick: () => void;
  label: string;
}) => {
  const isDark = theme === "dark";
  const style = active
    ? isDark
      ? { background: "#FFFFFF", color: "#000000", boxShadow: "0 1px 10px rgba(255,255,255,0.22)" }
      : { background: "#0A0A0A", color: "#FFFFFF", boxShadow: "0 1px 6px rgba(0,0,0,0.12)" }
    : { background: "transparent", color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)" };
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: spacing.themeBtn,
        height: spacing.themeBtn,
        borderRadius: radius.pill,
        display: "grid",
        placeItems: "center",
        border: "none",
        cursor: "pointer",
        transition: `all 400ms ${motion.easing.lux}`,
        ...style,
      }}
    >
      {icon}
    </button>
  );
};

export const ThemeSwitcher = ({ theme, setTheme, variant, mounted, tokens }: Props) => {
  const delay = variant === "desktop" ? 520 : 300;
  return (
    <div
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(6px)",
        transition: `opacity 640ms ${motion.easing.lux} ${delay}ms, transform 640ms ${motion.easing.lux} ${delay}ms`,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: 4,
          borderRadius: radius.pill,
          background: tokens.themePillBg,
          border: `1px solid ${tokens.borderColor}`,
          backdropFilter: "blur(8px)",
        }}
      >
        <ThemeButton active={theme === "light"} theme={theme} icon={<IconSun />} onClick={() => setTheme("light")} label="Light" />
        <ThemeButton active={theme === "dark"} theme={theme} icon={<IconMoon />} onClick={() => setTheme("dark")} label="Dark" />
      </div>
    </div>
  );
};