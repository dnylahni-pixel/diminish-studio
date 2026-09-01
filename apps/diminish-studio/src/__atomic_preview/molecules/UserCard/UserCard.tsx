/**
 * MOLECULE: UserCard - نسخه فایل اتمیک (بدون hover، padding 10، chevron ثابت)
 */
import { Theme, ThemeTokens, typography, motion } from "../../tokens";
import { Avatar } from "../../atoms/Avatar/Avatar";
import { IconChevron } from "../../atoms/Icons/Icons";

export const UserCard = ({ theme, variant, mounted, tokens }: { theme: Theme; variant: "desktop" | "mobile"; mounted: boolean; tokens: ThemeTokens }) => {
  const delay = variant === "desktop" ? 560 : 340;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 10px",
        borderRadius: 12,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(6px)",
        transition: `opacity 640ms ${motion.easing.lux} ${delay}ms, transform 640ms ${motion.easing.lux} ${delay}ms`,
      }}
    >
      <Avatar theme={theme} tokens={tokens} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: typography.userName.size, fontWeight: typography.userName.weight, color: tokens.textPrimary, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
          Daniel
        </div>
        <div style={{ fontSize: typography.userSub.size, fontWeight: typography.userSub.weight, color: tokens.textMuted, marginTop: 2 }}>
          Free account
        </div>
      </div>
      <span style={{ color: tokens.textMuted, opacity: 0.8, display: "flex" }}>
        <IconChevron size={14} />
      </span>
    </div>
  );
};