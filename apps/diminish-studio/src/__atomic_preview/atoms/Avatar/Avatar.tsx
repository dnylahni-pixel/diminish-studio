/**
 * ATOM: Avatar - D (نسخه فایل اتمیک)
 */
import { Theme, ThemeTokens, spacing, radius } from "../../tokens";

export const Avatar = ({ theme, tokens }: { theme: Theme; tokens: ThemeTokens }) => (
  <div
    style={{
      width: spacing.avatar,
      height: spacing.avatar,
      borderRadius: radius.avatar,
      background: tokens.avatarBg,
      color: tokens.avatarText,
      display: "grid",
      placeItems: "center",
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: "-0.02em",
      flexShrink: 0,
    }}
  >
    D
  </div>
);