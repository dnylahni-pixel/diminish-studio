/**
 * MOLECULE: Drawer - پورت shadcn/ui Drawer (بر پایه vaul) با توکن‌های dim°
 * API همان shadcn: Drawer, DrawerTrigger, DrawerPortal, DrawerOverlay,
 * DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription, DrawerClose
 *
 *_usage:
 * <Drawer tokens={tokens} theme={theme} open={open} onOpenChange={setOpen}>
 *   <DrawerPortal>
 *     <DrawerOverlay />
 *     <DrawerContent>...</DrawerContent>
 *   </DrawerPortal>
 * </Drawer>
 */
import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { colors, motion, type Theme, type ThemeTokens } from "../../tokens";

type DrawerContextValue = { tokens: ThemeTokens; theme: Theme };

const DrawerContext = React.createContext<DrawerContextValue>({
  tokens: colors.dark,
  theme: "dark",
});

const useDrawerTokens = () => React.useContext(DrawerContext);

export type DrawerProps = React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Root> & {
  /** توکن‌های تم فعال - به همه sub-component ها پاس داده میشود */
  tokens: ThemeTokens;
  theme?: Theme;
};

/** Root - معادل DrawerPrimitive.Root به‌علاوه Context توکن‌ها */
export const Drawer = ({ tokens: tk, theme = "dark", ...props }: DrawerProps) => {
  const value = React.useMemo(() => ({ tokens: tk, theme }), [tk, theme]);
  return (
    <DrawerContext.Provider value={value}>
      <DrawerPrimitive.Root {...props} />
    </DrawerContext.Provider>
  );
};

export const DrawerTrigger = DrawerPrimitive.Trigger;
export const DrawerPortal = DrawerPrimitive.Portal;
export const DrawerClose = DrawerPrimitive.Close;

/** Overlay - fixed inset-0 با backdrop توکن (شبه bg-black/80 در shadcn) */
export const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>((props, ref) => {
  const { tokens: tk } = useDrawerTokens();
  return (
    <DrawerPrimitive.Overlay
      ref={ref}
      {...props}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: tk.backdrop,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        ...props.style,
      }}
    />
  );
});
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

export type DrawerContentProps = React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> & {
  /** دستگیره بالا - پیش‌فرض روشن مثل نمونه‌های shadcn */
  showHandle?: boolean;
};

/** Content - شیت پایین صفحه، گوشه گرد بالا، max-width مرکزچین */
export const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  DrawerContentProps
>(({ showHandle = true, children, ...props }, ref) => {
  const { tokens: tk, theme } = useDrawerTokens();
  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Content
        ref={ref}
        {...props}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          margin: "0 auto",
          width: "100%",
          maxWidth: 520,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: 4,
          padding: "10px 14px calc(18px + env(safe-area-inset-bottom)) 14px",
          borderRadius: "22px 22px 0 0",
          borderTop: `1px solid ${tk.borderColor}`,
          background: tk.sidebar,
          boxShadow: theme === "dark" ? "0 -24px 70px rgba(0,0,0,0.55)" : "0 -24px 70px rgba(0,0,0,0.14)",
          outline: "none",
          ...props.style,
        }}
      >
        {showHandle && (
          <span
            aria-hidden
            style={{
              display: "block",
              width: 44,
              height: 4,
              borderRadius: 999,
              margin: "2px auto 10px",
              flexShrink: 0,
              background: tk.textMuted,
              opacity: 0.55,
            }}
          />
        )}
        {children}
      </DrawerPrimitive.Content>
    </DrawerPrimitive.Portal>
  );
});
DrawerContent.displayName = "DrawerContent";

export const DrawerHeader = ({ style, ...props }: React.ComponentPropsWithoutRef<"div">) => (
  <div
    {...props}
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 4,
      padding: "4px 6px 12px 6px",
      textAlign: "left",
      ...style,
    }}
  />
);

export const DrawerFooter = ({ style, ...props }: React.ComponentPropsWithoutRef<"div">) => (
  <div
    {...props}
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 8,
      padding: "12px 6px 2px 6px",
      ...style,
    }}
  />
);

export const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>((props, ref) => {
  const { tokens: tk } = useDrawerTokens();
  return (
    <DrawerPrimitive.Title
      ref={ref}
      {...props}
      style={{
        fontSize: 15,
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: "-0.01em",
        color: tk.textPrimary,
        ...props.style,
      }}
    />
  );
});
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

export const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>((props, ref) => {
  const { tokens: tk } = useDrawerTokens();
  return (
    <DrawerPrimitive.Description
      ref={ref}
      {...props}
      style={{
        fontSize: 12,
        lineHeight: 1.5,
        color: tk.textMuted,
        ...props.style,
      }}
    />
  );
});
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

/** Divider افقی با رنگ توکن - برای جداسازی اکشن خطرناک */
export const DrawerSeparator = ({ style, ...props }: React.ComponentPropsWithoutRef<"div">) => {
  const { tokens: tk } = useDrawerTokens();
  return (
    <div
      {...props}
      style={{
        height: 1,
        width: "100%",
        flexShrink: 0,
        margin: "6px 0",
        background: tk.borderColor,
        ...style,
      }}
    />
  );
};

/** ردیف اکشن داخل دراور - لمس‌پسند، هم‌خانواده با آیتم‌های منوی قبلی */
export const DrawerItem = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button"> & { danger?: boolean }
>(({ danger = false, style, onMouseEnter, onMouseLeave, ...props }, ref) => {
  const { tokens: tk } = useDrawerTokens();
  return (
    <button
      ref={ref}
      type="button"
      {...props}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        padding: "0 12px",
        height: 52,
        borderRadius: 14,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 550,
        fontFamily: "inherit",
        textAlign: "left",
        color: danger ? "#FB2C36" : tk.textPrimary,
        transition: `background 200ms ${motion.easing.lux}`,
        ...style,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = tk.hoverBg;
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        onMouseLeave?.(e);
      }}
    />
  );
});
DrawerItem.displayName = "DrawerItem";
