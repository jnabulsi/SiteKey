"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { createAdminSession } from "@/lib/auth/sessionRepo";
import { findOrgBySlug } from "@/lib/org/orgRepo";
import { verifyPassword } from "@/lib/auth/passwords";
import { checkRateLimit } from "@/lib/rateLimit/rateLimit";

const LOGIN_MAX = 10;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;

export async function adminLogin(formData: FormData) {
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";

  const orgSlug = String(formData.get("org") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const rl = await checkRateLimit(`login:${ip}`, LOGIN_MAX, LOGIN_WINDOW_MS);
  if (!rl.allowed) {
    redirect(`/o/${encodeURIComponent(orgSlug)}/login?error=rate_limit`);
  }

  const org = await findOrgBySlug(orgSlug);
  if (!org) {
    redirect(`/o/${encodeURIComponent(orgSlug)}/login?error=invalid`);
  }

  const valid = await verifyPassword(password, org.admin_password_hash);
  if (!valid) {
    redirect(`/o/${encodeURIComponent(orgSlug)}/login?error=invalid`);
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

  redirect(`/o/${encodeURIComponent(orgSlug)}/admin/assets`);
}
