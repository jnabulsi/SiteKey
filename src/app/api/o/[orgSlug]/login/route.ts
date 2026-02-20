import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { createAdminSession } from "@/lib/auth/sessionRepo";
import { findOrgBySlug } from "@/lib/org/orgRepo";
import { verifyPassword } from "@/lib/auth/passwords";
import { checkRateLimit } from "@/lib/rateLimit/rateLimit";

const LOGIN_MAX = 10;
const LOGIN_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export async function POST(
  req: Request,
  props: { params: Promise<{ orgSlug: string }> }
) {
  const { orgSlug } = await props.params;

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";

  const rl = await checkRateLimit(`login:${ip}`, LOGIN_MAX, LOGIN_WINDOW_MS);
  if (!rl.allowed) {
    const url = new URL(`/o/${encodeURIComponent(orgSlug)}/login`, req.url);
    url.searchParams.set("error", "rate_limit");
    return NextResponse.redirect(url, { status: 303 });
  }

  const formData = await req.formData();
  const password = String(formData.get("password") ?? "");

  const org = await findOrgBySlug(orgSlug);
  if (!org) {
    const url = new URL(`/o/${encodeURIComponent(orgSlug)}/login`, req.url);
    url.searchParams.set("error", "invalid");
    return NextResponse.redirect(url, { status: 303 });

  }

  const valid = await verifyPassword(password, org.admin_password_hash);
  if (!valid) {
    const url = new URL(`/o/${encodeURIComponent(orgSlug)}/login`, req.url);
    url.searchParams.set("error", "invalid");
    return NextResponse.redirect(url, { status: 303 });

  }

  const { rawToken, expiresAt } = await createAdminSession(org.id);

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: rawToken,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return NextResponse.redirect(new URL(`/o/${encodeURIComponent(orgSlug)}/admin/assets`, req.url), { status: 303 });
}

