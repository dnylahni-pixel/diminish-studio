/**
 * LAYER 0: DESIGN TOKENS - Motion
 */
export const motion = {
  easing: {
    lux: "cubic-bezier(0.32,0.72,0,1)",
  },
  duration: {
    fast: 300,
    base: 400,
    slow: 640,
  },
  staggerPrimary: 60,
  staggerSecondaryOffset: 380,
  mobilePrimary: [0, 40, 80, 120, 160],
  mobileSecondary: [220, 260],
} as const;