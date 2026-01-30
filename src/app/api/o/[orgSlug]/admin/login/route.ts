import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { createAdminSession } from "@/lib/auth/sessionRepo";
import { findOrgBySlug } from "@/lib/org/orgRepo";

export async function POST(
  req: Request,
  props: { params: Promise<{ orgSlug: string }> }
) {
  const { orgSlug } = await props.params;

  const formData = await req.formData();
  const password = String(formData.get("password") ?? "");

  const org = await findOrgBySlug(orgSlug);
  if (!org) {
    // Generic: do not leak org existence
    return NextResponse.redirect(new URL(`/o/${encodeURIComponent(orgSlug)}/admin/login`, req.url), { status: 303 });
  }

  const inputHash = crypto
    .createHash("sha256")
    .update(password, "utf8")
    .digest("hex");

  if (inputHash !== org.admin_password_hash) {
    return NextResponse.redirect(new URL(`/o/${encodeURIComponent(orgSlug)}/admin/login`, req.url), { status: 303 });
  }

  const { rawToken, expiresAt } = await createAdminSession(org.id);

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: rawToken,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return NextResponse.redirect(new URL(`/o/${encodeURIComponent(orgSlug)}/admin`, req.url), { status: 303 });
}

