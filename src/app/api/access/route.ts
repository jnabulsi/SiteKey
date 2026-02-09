import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { findAssetByPublicToken } from "@/lib/assets/assetRepo";
import { createFieldSession } from "@/lib/auth/sessionRepo";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/passwords";

export async function POST(req: Request) {
  const formData = await req.formData();

  const accessCode = String(formData.get("accessCode") ?? "");
  const assetToken = String(formData.get("assetToken") ?? "");
  const next = String(formData.get("next") ?? "/");

  function failRedirect(error: string) {
    const url = new URL("/access", req.url);
    url.searchParams.set("error", error);
    if (assetToken) url.searchParams.set("assetToken", assetToken);
    if (next && next !== "/") url.searchParams.set("next", next);
    return NextResponse.redirect(url, { status: 303 });
  }

  // Resolve asset → org
  const asset = await findAssetByPublicToken(assetToken);
  if (!asset) return failRedirect("invalid");

  const org = await prisma.organisation.findUnique({
    where: { id: asset.org_id },
  });
  if (!org) return failRedirect("invalid");

  // Validate access code
  const valid = await verifyPassword(accessCode, org.access_code_hash);
  if (!valid) return failRedirect("invalid");

  // Create session
  const { rawToken, expiresAt } = await createFieldSession(org.id);

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    value: rawToken,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  const safeNext = next.startsWith("/") ? next : "/";
  return NextResponse.redirect(new URL(safeNext, req.url), { status: 303 });
}


