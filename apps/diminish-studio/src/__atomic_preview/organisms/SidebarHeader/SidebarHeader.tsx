/**
 * ORGANISM: SidebarHeader - Logo + Close (نسخه فایل اتمیک: padding 28/20/8/20)
 */
import { Theme, ThemeTokens, motion } from "../../tokens";
import { Logo } from "../../atoms/Logo/Logo";
import { IconClose } from "../../atoms/Icons/Icons";

export const SidebarHeader = ({
  theme,
  variant,
  mounted,
  tokens,
  onClose,
}: {
  theme: Theme;
  variant: "desktop" | "mobile";
  mounted: boolean;
  tokens: ThemeTokens;
  onClose: () => void;
}) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "28px 20px 8px 20px" }}>
    <div
      className="logo-wrap"
      style={{
        display: "flex",
        alignItems: "flex-start",
        color: tokens.textPrimary,
        cursor: "default",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(-6px)",
        transition: `opacity 640ms ${motion.easing.lux} 0ms, transform 640ms ${motion.easing.lux} 0ms`,
        userSelect: "none",
      }}
    >
      <Logo />
    </div>
    {variant === "mobile" && onClose && (
      <button
        onClick={onClose}
        style={{
          width: 32,
          height: 32,
          display: "grid",
          placeItems: "center",
          borderRadius: 8,
          border: `1px solid ${tokens.borderColor}`,
          background: "transparent",
          color: tokens.textMuted,
          cursor: "pointer",
        }}
      >
        <IconClose size={18} />
      </button>
    )}
  </div>
);