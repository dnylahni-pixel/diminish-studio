/**
 * ORGANISM: SidebarFooter - Theme + User (نسخه فایل اتمیک: padding 16/12/18/12، gap 14)
 */
import { Theme, ThemeTokens } from "../../tokens";
import { ThemeSwitcher } from "../../molecules/ThemeSwitcher/ThemeSwitcher";
import { UserCard } from "../../molecules/UserCard/UserCard";

export const SidebarFooter = ({
  theme,
  setTheme,
  variant,
  mounted,
  tokens,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
  variant: "desktop" | "mobile";
  mounted: boolean;
  tokens: ThemeTokens;
}) => (
  <div style={{ marginTop: "auto", padding: "16px 12px 18px 12px", display: "flex", flexDirection: "column", gap: 14 }}>
    <div style={{ padding: "0 8px" }}>
      <ThemeSwitcher theme={theme} setTheme={setTheme} variant={variant} mounted={mounted} tokens={tokens} />
    </div>
    <UserCard theme={theme} variant={variant} mounted={mounted} tokens={tokens} />
  </div>
);