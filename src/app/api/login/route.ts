import { NextResponse } from "next/server";
import { AUTH_COOKIE, authEnabled, expectedToken } from "@/lib/auth";

export async function POST(req: Request) {
  const { code } = (await req.json().catch(() => ({}))) as { code?: string };
  if (authEnabled() && code !== process.env.APP_ACCESS_CODE) {
    return NextResponse.json({ error: "Falscher Code" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, await expectedToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
