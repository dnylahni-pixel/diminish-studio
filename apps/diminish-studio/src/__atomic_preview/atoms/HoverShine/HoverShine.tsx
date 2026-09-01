/**
 * ATOM: HoverShine - گرادینت sweep هوور (تم-آگاه: سفید در دارک، مشکی در لایت)
 */
import { Theme, radius } from "../../tokens";

export const HoverShine = ({ theme }: { theme: Theme }) => (
  <span
    className="nav-shine"
    style={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      borderRadius: radius.nav,
      background:
        theme === "dark"
          ? "linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0) 100%)"
          : "linear-gradient(100deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0) 100%)",
    }}
  />
);