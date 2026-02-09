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

  // Resolve asset → org
  const asset = await findAssetByPublicToken(assetToken);
  if (!asset) {
    return NextResponse.redirect(new URL("/access", req.url), { status: 303 });
  }

  const org = await prisma.organisation.findUnique({
    where: { id: asset.org_id },
  });
  if (!org) {
    return NextResponse.redirect(new URL("/access", req.url), { status: 303 });
  }

  // Validate access code
  const valid = await verifyPassword(accessCode, org.access_code_hash);
  if (!valid) {
    return NextResponse.redirect(new URL("/access", req.url), { status: 303 });
  }

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


