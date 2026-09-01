/**
 * MOLECULE: Divider - نسخه فایل اتمیک
 */
import { ThemeTokens, spacing, motion } from "../../tokens";

export const Divider = ({ variant, mounted, tokens }: { variant: "desktop" | "mobile"; mounted: boolean; tokens: ThemeTokens }) => {
  const delay = variant === "desktop" ? 380 : 200;
  return (
    <div
      style={{
        marginTop: spacing.sectionMy,
        marginBottom: spacing.sectionMy,
        height: 1,
        width: "100%",
        background: tokens.borderColor,
        transformOrigin: "left",
        transform: mounted ? "scaleX(1)" : "scaleX(0.6)",
        opacity: mounted ? 1 : 0,
        transition: `transform 640ms ${motion.easing.lux} ${delay}ms, opacity 400ms ${motion.easing.lux} ${delay}ms`,
      }}
    />
  );
};