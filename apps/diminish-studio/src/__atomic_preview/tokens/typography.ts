/**
 * LAYER 0: DESIGN TOKENS - Typography
 */
export const typography = {
  fontSans: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
  fontAccent: '"Instrument Serif", ui-serif, Georgia, serif',
  logoDim: {
    size: "22px",
    weight: 650,
    tracking: "-0.05em",
    lineHeight: "1",
  },
  logoDegree: {
    size: "14px",
    weight: 600,
  },
  nav: {
    size: "14px",
    weight: 450,
    lineHeight: "1",
    tracking: "-0.01em",
  },
  userName: {
    size: "14px",
    weight: 550,
  },
  userSub: {
    size: "12.5px",
    weight: 450,
  },
} as const;