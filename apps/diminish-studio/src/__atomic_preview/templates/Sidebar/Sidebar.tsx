/**
 * TEMPLATE: Sidebar - aside کامل (نسخه فایل اتمیک: sticky/fixed، 100vh، overflowY)
 */
import { Theme, ThemeTokens, spacing } from "../../tokens";
import { SidebarHeader } from "../../organisms/SidebarHeader/SidebarHeader";
import { SidebarNavGroup } from "../../organisms/SidebarNavGroup/SidebarNavGroup";
import { SidebarFooter } from "../../organisms/SidebarFooter/SidebarFooter";
import { Divider } from "../../molecules/Divider/Divider";
import { ICON_MAP } from "../../atoms/Icons/Icons";
import { UploadIndicator } from "../../molecules/UploadIndicator/UploadIndicator";
import { useUploadStore } from "../../stores/uploadStore";

type Props = {
  theme: Theme;
  active: string;
  setActive: (id: string) => void;
  setTheme: (t: Theme) => void;
  tokens: ThemeTokens;
  variant: "desktop" | "mobile";
  mounted: boolean;
  onClose: () => void;
};

const PRIMARY = [
  { id: "Home", label: "Home" },
  { id: "Explore", label: "Explore" },
  { id: "Feed", label: "Feed" },
  { id: "Upload", label: "Upload" },
  { id: "Library", label: "Library" },
] as const;

const SECONDARY = [
  { id: "Settings", label: "Settings" },
  { id: "Support", label: "Support" },
] as const;

export const Sidebar = ({ theme, active, setActive, setTheme, tokens, variant, mounted, onClose }: Props) => {
  const isDesktop = variant === "desktop";
  const uploadStatus = useUploadStore((s) => s.status);
  return (
    <aside
      style={{
        width: isDesktop ? spacing.sidebarW.desktop : spacing.sidebarW.mobile,
        maxWidth: isDesktop ? undefined : "85vw",
        height: "100vh",
        background: tokens.sidebar,
        color: tokens.textPrimary,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: isDesktop ? "sticky" : "fixed",
        top: 0,
        left: 0,
        zIndex: 40,
        boxShadow: tokens.shadowInset,
        borderRight: `1px solid ${tokens.borderColor}`,
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <SidebarHeader theme={theme} variant={variant} mounted={mounted} tokens={tokens} onClose={onClose} />
      <div style={{ paddingTop: 18, flex: 1, display: "flex", flexDirection: "column" }}>
        <SidebarNavGroup
          items={PRIMARY as unknown as { id: keyof typeof ICON_MAP; label: string }[]}
          active={active}
          setActive={setActive}
          theme={theme}
          variant={variant}
          mounted={mounted}
          tokens={tokens}
          group="primary"
          startDelayDesktop={80}
          startDelayMobile={0}
        />
        <div style={{ padding: "0 10px" }}>
          <Divider variant={variant} mounted={mounted} tokens={tokens} />
        </div>
        <SidebarNavGroup
          items={SECONDARY as unknown as { id: keyof typeof ICON_MAP; label: string }[]}
          active={active}
          setActive={setActive}
          theme={theme}
          variant={variant}
          mounted={mounted}
          tokens={tokens}
          group="secondary"
          startDelayDesktop={380}
          startDelayMobile={220}
        />
        {/* atomic upload indicator (token-driven) — mirrors AppLayout UploadIndicator; only when active */}
        {uploadStatus !== "idle" && (
          <div style={{ padding: "10px 10px 0 10px" }}>
            <UploadIndicator tokens={tokens} compact={true} onNavigateUpload={() => setActive("Upload")} />
          </div>
        )}
      </div>
      <SidebarFooter theme={theme} setTheme={setTheme} variant={variant} mounted={mounted} tokens={tokens} />
    </aside>
  );
};