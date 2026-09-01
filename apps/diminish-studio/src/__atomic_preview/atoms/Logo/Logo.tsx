/**
 * ATOM: Logo - dim° (نسخه فایل اتمیک: degree با فونت serif و کلاس logo-degree)
 */
import { typography } from "../../tokens";

export const Logo = () => (
  <div className="logo-wrap" style={{ display: "flex", alignItems: "flex-start" }}>
    <span
      style={{
        fontSize: typography.logoDim.size,
        fontWeight: typography.logoDim.weight,
        letterSpacing: typography.logoDim.tracking,
        lineHeight: typography.logoDim.lineHeight,
        fontFamily: typography.fontSans,
      }}
    >
      dim
    </span>
    <span
      className="logo-degree"
      style={{
        fontSize: typography.logoDegree.size,
        fontWeight: typography.logoDegree.weight,
        marginLeft: 1,
        position: "relative",
        top: -6,
        fontFamily: typography.fontAccent,
        lineHeight: 1,
      }}
    >
      °
    </span>
  </div>
);