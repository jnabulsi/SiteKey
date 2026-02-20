"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { createAdminSession } from "@/lib/auth/sessionRepo";
import { hashPassword } from "@/lib/auth/passwords";
import { createOrganisation, checkSlugExists } from "@/lib/org/orgRepo";
import { validateSlug } from "@/lib/org/slugValidation";
import { checkRateLimit } from "@/lib/rateLimit/rateLimit";

const ORG_CREATE_MAX = 3;
const ORG_CREATE_WINDOW_MS = 60 * 60 * 1000;

export async function createOrg(formData: FormData) {
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";

  const rl = await checkRateLimit(`org-create:${ip}`, ORG_CREATE_MAX, ORG_CREATE_WINDOW_MS);
  if (!rl.allowed) redirect("/?error=rate_limit");

  const name = String(formData.get("name") ?? "").trim().slice(0, 200);
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const adminPassword = String(formData.get("adminPassword") ?? "");
  const accessCode = String(formData.get("accessCode") ?? "");

  if (!name) redirect("/?error=name_required");
  if (adminPassword.length < 8) redirect("/?error=password_short");
  if (!accessCode) redirect("/?error=access_code_required");

  const slugResult = validateSlug(slug);
  if (!slugResult.valid) redirect("/?error=invalid_slug");

  const exists = await checkSlugExists(slug);
  if (exists) redirect("/?error=slug_taken");

  const [adminPasswordHash, accessCodeHash] = await Promise.all([
    hashPassword(adminPassword),
    hashPassword(accessCode),
  ]);

  const org = await createOrganisation({ name, slug, adminPasswordHash, accessCodeHash });

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

  redirect(`/o/${encodeURIComponent(slug)}/admin`);
}
