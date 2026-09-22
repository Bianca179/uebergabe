import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, authEnabled, isValidToken } from "@/lib/auth";

const PUBLIC = ["/login", "/api/login", "/manifest.webmanifest", "/icons", "/favicon.ico"];

export async function proxy(req: NextRequest) {
  if (!authEnabled()) return NextResponse.next();
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) return NextResponse.next();
  const ok = await isValidToken(req.cookies.get(AUTH_COOKIE)?.value);
  if (ok) return NextResponse.next();
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
