/**
 * PART: LRSheet - شیت L & R (پن هر استم) - L/R دو سر اسلایدر، عدد بزرگ، Reset
 */
import { Theme, ThemeTokens } from "../../../tokens";
import {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "../../../molecules/Drawer/Drawer";
import { Slider } from "../../../molecules/Slider/Slider";

export type LRSheetProps = {
  tokens: ThemeTokens;
  theme: Theme;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  label: string;
  pan: number;
  onPan: (v: number) => void;
};

export const LRSheet = ({ tokens: tk, theme, open, onOpenChange, label, pan, onPan }: LRSheetProps) => (
  <Drawer tokens={tk} theme={theme} open={open} onOpenChange={onOpenChange}>
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerContent aria-label={`${label} L and R`} style={{ maxWidth: 560 }}>
        <DrawerHeader style={{ alignItems: "center", padding: "2px 6px 4px" }}>
          <DrawerTitle style={{ fontSize: 19, textAlign: "center", width: "100%" }}>{label || "L & R"}</DrawerTitle>
        </DrawerHeader>

        <div style={{ padding: "10px 14px 4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: tk.textMuted, marginBottom: 4 }}>
            <span>L</span>
            <span>R</span>
          </div>
          <div style={{ position: "relative" }}>
            {/* نوار مرکز */}
            <span aria-hidden style={{ position: "absolute", left: "50%", top: 7, width: 1.5, height: 14, background: tk.textPrimary, opacity: 0.9, transform: "translateX(-50%)" }} />
            <Slider tokens={tk} ariaLabel="Pan" value={pan} min={-100} max={100} onChange={onPan} showBubble={false} />
          </div>
          <div style={{ textAlign: "center", fontSize: 30, fontWeight: 700, fontFamily: "ui-monospace, monospace", padding: "10px 0 2px" }}>
            {pan}
          </div>
          {pan !== 0 && (
            <div style={{ textAlign: "center", paddingBottom: 6 }}>
              <button
                onClick={() => onPan(0)}
                style={{
                  background: "none",
                  border: "none",
                  color: tk.textMuted,
                  fontSize: 14,
                  fontWeight: 550,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  padding: "6px 10px",
                }}
              >
                Reset to original
              </button>
            </div>
          )}
        </div>
      </DrawerContent>
    </DrawerPortal>
  </Drawer>
);
