import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

export async function POST(req: Request) {
  const cookieStore = await cookies();

  // Clear cookie (match path)
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

