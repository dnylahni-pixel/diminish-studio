/**
 * LAB PREVIEW: sidebar-atomic isolated preview
 * Bridges host app theme (useTheme -> isDark) to atomic tokens (colors[theme])
 * and renders Sidebar inside .atomic-scope (scoped atomic.css) WITHOUT AppShell.
 * Route: /lab/sidebar-atomic
 */
import { useEffect, useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import { Sidebar } from "@/__atomic_preview/templates/Sidebar/Sidebar";
import { UploadView } from "@/__atomic_preview/templates/Upload/UploadView";
import { LibraryReal } from "@/__atomic_preview/templates/Library/LibraryReal";
import { PlayerReal } from "@/__atomic_preview/templates/Player/PlayerReal";
import { colors } from "@/__atomic_preview/tokens/colors";
import type { Theme } from "@/__atomic_preview/tokens/colors";
import { motion, typography } from "@/__atomic_preview/tokens";
import "@/__atomic_preview/atomic.css";

export function LabSidebarAtomicPage() {
  const { isDark, setTheme: setStudioTheme } = useTheme();
  const theme: Theme = isDark ? "dark" : "light";
  const tokens = colors[theme];

  const [active, setActive] = useState("Upload");
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // staggered mount animation — matches atomic AppShell 50ms delay
  useEffect(() => {
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, [theme]);

  const handleSetTheme = (t: Theme) => {
    // bridge atomic theme switcher -> host app theme
    setStudioTheme(t);
  };

  return (
    <div
      className="atomic-scope"
      style={{
        display: "flex",
        minHeight: "100vh",
        background: tokens.app,
        transition: `background 400ms ${motion.easing.lux}`,
      }}
    >
      {/* Desktop sidebar — isolated */}
      <div className="hidden md:flex">
        <Sidebar
          theme={theme}
          active={active}
          setActive={setActive}
          setTheme={handleSetTheme}
          tokens={tokens}
          variant="desktop"
          mounted={mounted}
          onClose={() => {}}
        />
      </div>

      {/* Mobile drawer simulation — uses same Sidebar with variant mobile */}
      {/* For preview we just render mobile as fixed overlay when needed; keep simple */}
      <div className="flex md:hidden" style={{ display: "none" }} aria-hidden />

      {/* Demo content — proves isolation, not using AppShell */}
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", padding: "32px 24px", overflowY: "auto" }}>
        {/* Mobile top bar imitation for visual parity */}
        <div className="flex md:hidden" style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: typography.fontSans, fontSize: 12, color: tokens.textMuted }}>preview / lab</div>
          <div style={{ fontSize: 11, color: tokens.textMuted, background: tokens.themePillBg, padding: "4px 8px", borderRadius: 999, border: `1px solid ${tokens.borderColor}` }}>
            theme: {theme} • {active}
          </div>
        </div>

        {active === "Upload" ? (
          <div style={{ width: "100%", maxWidth: 760, alignSelf: "center", flex: 1 }}>
            <UploadView theme={theme} tokens={tokens} />
            <div
              style={{
                marginTop: 32,
                paddingTop: 16,
                borderTop: `1px solid ${tokens.borderColor}`,
                fontSize: 11,
                color: tokens.textMuted,
                lineHeight: 1.6,
                fontFamily: typography.fontSans,
              }}
            >
              Route:{" "}
              <code style={{ background: tokens.themePillBg, padding: "2px 6px", borderRadius: 6, border: `1px solid ${tokens.borderColor}` }}>
                /lab/sidebar-atomic → Upload
              </code>{" "}
              — atomic preview real wiring: <code style={{ background: tokens.themePillBg, padding: "2px 6px", borderRadius: 6 }}>presign → PUT 95% → confirm</code> with <code style={{ background: tokens.themePillBg, padding: "2px 6px", borderRadius: 6 }}>runtimeConfig</code> limits. Tokens-only styling (no index.css vars). Indicator in Sidebar shows live progress.
            </div>
          </div>
        ) : active === "Library" ? (
          <div style={{ width: "100%", maxWidth: 1240, alignSelf: "center", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <LibraryReal
              theme={theme}
              tokens={tokens}
              selectedId={selectedSongId}
              onSelect={(id) => {
                setSelectedSongId(id);
                setPlayerOpen(true);
              }}
            />
            <div
              style={{
                marginTop: 16,
                paddingTop: 12,
                borderTop: `1px solid ${tokens.borderColor}`,
                fontSize: 11,
                color: tokens.textMuted,
                lineHeight: 1.6,
                fontFamily: typography.fontSans,
              }}
            >
              Route:{" "}
              <code style={{ background: tokens.themePillBg, padding: "2px 6px", borderRadius: 6, border: `1px solid ${tokens.borderColor}` }}>
                /lab/sidebar-atomic → Library → PlayerReal
              </code>{" "}
              — atomic Library (<code style={{ background: tokens.themePillBg, padding: "2px 6px", borderRadius: 6 }}>useGetUserLibrary</code>) opens{" "}
              <code style={{ background: tokens.themePillBg, padding: "2px 6px", borderRadius: 6 }}>PlayerReal</code> overlay — real{" "}
              <code style={{ background: tokens.themePillBg, padding: "2px 6px", borderRadius: 6 }}>GET /song-details/:id</code> +{" "}
              <code style={{ background: tokens.themePillBg, padding: "2px 6px", borderRadius: 6 }}>AudioEngine</code> (no mock setInterval). Click a song to play.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 900, width: "100%", alignSelf: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontFamily: typography.fontAccent, fontSize: 38, fontWeight: 400, letterSpacing: "-0.03em", color: tokens.textPrimary, lineHeight: 1.05 }}>
                Atomic Sidebar <span style={{ fontFamily: typography.fontSans, fontSize: 14, fontWeight: 500, color: tokens.textMuted }}>(preview)</span>
              </div>
              <div style={{ fontSize: 14, color: tokens.textMuted, lineHeight: 1.6, maxWidth: 620 }}>
                Isolated preview — Sidebar is rendered inside <code style={{ background: tokens.themePillBg, padding: "2px 6px", borderRadius: 6, border: `1px solid ${tokens.borderColor}` }}>.atomic-scope</code> with scoped <code style={{ background: tokens.themePillBg, padding: "2px 6px", borderRadius: 6, border: `1px solid ${tokens.borderColor}` }}>atomic.css</code>. Host <code>useTheme()</code> is bridged to <code>colors[theme]</code>. No <code>AppShell</code> is imported here. Click <strong style={{ color: tokens.textPrimary }}>Library</strong> or <strong style={{ color: tokens.textPrimary }}>Upload</strong> in the sidebar to see real atomic wiring (no mocks).
              </div>
            </div>

            <div
              style={{
                padding: "16px 16px",
                borderRadius: 16,
                background: tokens.sidebar,
                border: `1px solid ${tokens.borderColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: theme === "light" ? "0 1px 3px rgba(0,0,0,0.04)" : "none",
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: tokens.textMuted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>Current Route (atomic active)</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: tokens.textPrimary, marginTop: 6, letterSpacing: "-0.02em" }}>{active}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: tokens.textMuted, background: tokens.themePillBg, padding: "6px 10px", borderRadius: 999, border: `1px solid ${tokens.borderColor}` }}>
                  easing: lux-ease
                </span>
                <span style={{ fontSize: 12, color: tokens.textMuted, background: tokens.themePillBg, padding: "6px 10px", borderRadius: 999, border: `1px solid ${tokens.borderColor}` }}>
                  variant: desktop
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              {[
                { l: "Layer 0", v: "TOKENS", d: "colors, typography, spacing, easing" },
                { l: "Layer 3", v: "MOLECULES", d: "NavItem, Divider, ThemeSwitch, StorageQuotaBar" },
                { l: "Layer 4", v: "ORGANISMS", d: "Header, NavGroup, Footer" },
                { l: "Layer 5", v: "TEMPLATE", d: "Sidebar (isolated) + Upload (P0 real) + Library (P0 real)" },
              ].map((m) => (
                <div
                  key={m.v}
                  style={{
                    padding: "14px 14px",
                    borderRadius: 14,
                    background: tokens.sidebar,
                    border: `1px solid ${tokens.borderColor}`,
                    boxShadow: theme === "light" ? "0 1px 3px rgba(0,0,0,0.04)" : "none",
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 650, letterSpacing: "0.08em", color: tokens.textMuted, textTransform: "uppercase" as const }}>{m.l}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary, marginTop: 4, letterSpacing: "-0.01em" }}>{m.v}</div>
                  <div style={{ fontSize: 12, color: tokens.textMuted, marginTop: 4 }}>{m.d}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, color: tokens.textMuted, lineHeight: 1.6, borderTop: `1px solid ${tokens.borderColor}`, paddingTop: 16 }}>
              Route: <code style={{ background: tokens.themePillBg, padding: "2px 6px", borderRadius: 6 }}>/lab/sidebar-atomic</code> — preview/sidebar-atomic branch. Upload + Library + Player are now real (runtimeConfig, no mocks).
            </div>
          </div>
        )}
      </main>

      {/* Real Player overlay — triggered from LibraryReal */}
      <PlayerReal
        theme={theme}
        tokens={tokens}
        songId={selectedSongId}
        open={playerOpen}
        onClose={() => setPlayerOpen(false)}
        onAction={(a) => console.log("[PlayerReal action]", a)}
      />
    </div>
  );
}

export default LabSidebarAtomicPage;
