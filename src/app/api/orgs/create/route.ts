import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { createAdminSession } from "@/lib/auth/sessionRepo";
import { hashPassword } from "@/lib/auth/passwords";
import {
  createOrganisation,
  checkSlugExists,
} from "@/lib/org/orgRepo";
import { validateSlug } from "@/lib/org/slugValidation";
import { checkRateLimit } from "@/lib/rateLimit/rateLimit";

const ORG_CREATE_MAX = 3;
const ORG_CREATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function getClientIp(hdrs: Headers): string {
  return (
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown"
  );
}

function redirectWithError(baseUrl: string, error: string) {
  const url = new URL("/", baseUrl);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(req: Request) {
  const hdrs = await headers();
  const ip = getClientIp(hdrs);

  // Rate limit
  const rl = await checkRateLimit(`org-create:${ip}`, ORG_CREATE_MAX, ORG_CREATE_WINDOW_MS);
  if (!rl.allowed) {
    return redirectWithError(req.url, "rate_limit");
  }

  const formData = await req.formData();
  const name = String(formData.get("name") ?? "").trim().slice(0, 200);
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const adminPassword = String(formData.get("adminPassword") ?? "");
  const accessCode = String(formData.get("accessCode") ?? "");

  // Validate inputs
  if (!name) {
    return redirectWithError(req.url, "name_required");
  }
  if (adminPassword.length < 8) {
    return redirectWithError(req.url, "password_short");
  }
  if (!accessCode) {
    return redirectWithError(req.url, "access_code_required");
  }

  // Validate slug
  const slugResult = validateSlug(slug);
  if (!slugResult.valid) {
    return redirectWithError(req.url, "invalid_slug");
  }

  // Check uniqueness
  const exists = await checkSlugExists(slug);
  if (exists) {
    return redirectWithError(req.url, "slug_taken");
  }

  // Hash credentials
  const [adminPasswordHash, accessCodeHash] = await Promise.all([
    hashPassword(adminPassword),
    hashPassword(accessCode),
  ]);

  // Create org
  const org = await createOrganisation({
    name,
    slug,
    adminPasswordHash,
    accessCodeHash,
  });

  // Create admin session
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

  return NextResponse.redirect(
    new URL(`/o/${encodeURIComponent(slug)}/admin`, req.url),
    { status: 303 }
  );
}
