import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/:locale/sign-in(.*)",
]);

function detectLocale(request: Request & { cookies: { get: (n: string) => { value: string } | undefined }; headers: Headers } | any): Locale {
  const cookie = request.cookies.get("locale")?.value;
  if (isLocale(cookie)) return cookie;
  const header = request.headers.get("accept-language") ?? "";
  if (/\bfa([-_]|$)/i.test(header)) return "fa";
  return defaultLocale;
}

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1];

  // Public routes: apply locale handling but skip auth
  const isPublic = isPublicRoute(request);

  // Locale handling — always applied (keeps URL canonical with /en or /fa)
  // This must run even for public routes so /sign-in -> /fa/sign-in works

  if (!isLocale(first)) {
    const locale = detectLocale(request as any);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    const response = NextResponse.redirect(url);
    response.cookies.set("locale", locale, { path: "/" });
    return response;
  }

  // Locale-prefixed URL — rewrite to unprefixed internal route
  const locale = first as Locale;
  const url = request.nextUrl.clone();
  url.pathname = pathname.length === first.length + 1 ? "/" : pathname.slice(first.length + 1);

  // For protected routes: enforce auth before rewriting
  if (!isPublic) {
    await auth.protect();
  }

  const response = NextResponse.rewrite(url);
  response.cookies.set("locale", locale, { path: "/" });
  return response;
});

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)" ],
};
