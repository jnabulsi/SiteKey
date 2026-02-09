import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { hashSessionToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: Request) {
  const cookieStore = await cookies();

  // Invalidate session in DB
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (rawToken) {
    const tokenHash = hashSessionToken(rawToken);
    await prisma.session.deleteMany({
      where: { session_token_hash: tokenHash },
    });
  }

  // Clear cookie
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  // Send user somewhere sensible (admin login if they came from admin, else home)
  const url = new URL(req.url);
  const next = url.searchParams.get("next");
  const safeNext = next && next.startsWith("/") ? next : "/";

  return NextResponse.redirect(new URL(safeNext, req.url), { status: 303 });
}

