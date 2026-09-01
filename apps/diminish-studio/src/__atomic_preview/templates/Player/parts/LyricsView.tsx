/**
 * PART: LyricsView - متن ترانه سینک‌شده (RTL، فونت فارسی)
 * خط جاری روشن و بولد، خطوط آینده کم‌رنگ - اسکرول خودکار دنبال پخش
 */
import * as React from "react";
import { ThemeTokens, motion, typography } from "../../../tokens";

export type LyricsViewProps = {
  tokens: ThemeTokens;
  lines: string[];
  currentLine: number;
};

export const LyricsView = ({ tokens: tk, lines, currentLine }: LyricsViewProps) => {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const lineRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  React.useEffect(() => {
    const box = boxRef.current;
    const el = lineRefs.current[currentLine];
    if (!box || !el) return;
    const target = el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2;
    box.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  }, [currentLine]);

  return (
    <div
      ref={boxRef}
      style={{
        flex: 1,
        minHeight: 220,
        overflowY: "auto",
        scrollbarWidth: "none",
        padding: "24px 26px 40vh 26px",
        direction: "rtl",
      }}
    >
      {lines.map((line, i) => {
        const state = i === currentLine ? "current" : i < currentLine ? "past" : "future";
        return (
          <div
            key={i}
            ref={(el) => {
              lineRefs.current[i] = el;
            }}
            style={{
              fontFamily: "Vazirmatn, Inter, sans-serif",
              fontSize: i === currentLine ? 32 : 30,
              fontWeight: i === currentLine ? 650 : 500,
              lineHeight: 2,
              color: tk.textPrimary,
              opacity: state === "current" ? 1 : state === "past" ? 0.85 : 0.28,
              transform: state === "current" ? "scale(1)" : "scale(0.985)",
              transformOrigin: "right center",
              transition: `opacity 400ms ${motion.easing.lux}, font-size 300ms ${motion.easing.lux}, transform 400ms ${motion.easing.lux}`,
              cursor: "default",
            }}
          >
            {line}
          </div>
        );
      })}
      <div style={{ height: 60, fontFamily: typography.fontAccent }} aria-hidden />
    </div>
  );
};
