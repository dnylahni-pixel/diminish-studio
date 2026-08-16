import type { ReactNode } from "react";

/**
 * Inert passthrough. The app uses a rewrite-based locale strategy: the proxy
 * rewrites `/en/*` and `/fa/*` to the unprefixed route and the root layout
 * resolves the locale from the `locale` cookie. The `[lang]` segment is kept
 * only so URL prefixes stay valid; it never renders its own <html>.
 */
export default function LangLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
