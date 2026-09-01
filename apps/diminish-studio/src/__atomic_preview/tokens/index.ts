/**
 * LAYER 0: BARREL EXPORT - All tokens
 */
export * from "./colors";
export * from "./motion";
export * from "./typography";
export * from "./spacing";

import { colors } from "./colors";
import { motion } from "./motion";
import { typography } from "./typography";
import { spacing, radius } from "./spacing";

export const tokens = {
  colors,
  motion,
  typography,
  spacing,
  radius,
} as const;
