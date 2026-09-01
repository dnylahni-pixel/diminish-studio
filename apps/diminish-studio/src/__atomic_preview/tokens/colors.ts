/**
 * LAYER 0: DESIGN TOKENS - Colors
 * هیچ رنگی نباید هاردکد باشد - همه از اینجا می‌آید
 */
export const colors = {
  dark: {
    app: "#0E0E0E",
    sidebar: "#000000",
    textPrimary: "#FFFFFF",
    textMuted: "#6B6B6B",
    borderColor: "rgba(255,255,255,0.10)",
    hoverBg: "rgba(255,255,255,0.06)",
    activeBg: "rgba(255,255,255,0.08)",
    themePillBg: "rgba(255,255,255,0.06)",
    avatarBg: "#FFFFFF",
    avatarText: "#000000",
    shadowInset: "inset -1px 0 0 rgba(255,255,255,0.06), inset -16px 0 32px rgba(255,255,255,0.02)",
    backdrop: "rgba(0,0,0,0.38)",
    accent: "#5EEAD4",
  },
  light: {
    app: "#F5F5F5",
    sidebar: "#FFFFFF",
    textPrimary: "#0A0A0A",
    textMuted: "#9A9A9A",
    borderColor: "rgba(0,0,0,0.08)",
    hoverBg: "rgba(0,0,0,0.05)",
    activeBg: "rgba(0,0,0,0.06)",
    themePillBg: "rgba(0,0,0,0.04)",
    avatarBg: "#0A0A0A",
    avatarText: "#FFFFFF",
    shadowInset: "inset -1px 0 0 rgba(0,0,0,0.06)",
    backdrop: "rgba(255,255,255,0.55)",
    accent: "#0F766E",
  },
} as const;

export type Theme = keyof typeof colors;
/** توکن‌های تم - مقادیر widen شده به string تا union تم‌ها هم قابل پاس دادن باشد */
export type ThemeTokens = { readonly [K in keyof (typeof colors.dark)]: string };