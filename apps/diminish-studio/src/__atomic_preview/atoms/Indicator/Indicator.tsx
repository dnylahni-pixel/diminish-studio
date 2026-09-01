/**
 * ATOM: Indicator - خط 3x14 کنار آیتم اکتیو (نسخه فایل اتمیک)
 */
import { motion } from "../../tokens";

export const Indicator = ({ active, color }: { active: boolean; color: string }) => (
  <span
    style={{
      position: "absolute",
      left: -1,
      top: "50%",
      width: 3,
      height: 14,
      borderRadius: 999,
      background: color,
      opacity: active ? 0.9 : 0,
      transform: "translateY(-50%)",
      transition: `opacity 300ms ${motion.easing.lux}, transform 400ms ${motion.easing.lux}`,
    }}
  />
);