import { NextResponse } from "next/server";
import { findOrgBySlug } from "@/lib/org/orgRepo";
import { prisma } from "@/lib/db/prisma";
import { requireAdminSession } from "@/lib/auth/requireAdminSession";
import { generatePublicToken } from "@/lib/assets/tokens";

export async function POST(
  req: Request,
  props: { params: Promise<{ orgSlug: string }> }
) {
  const { orgSlug } = await props.params;

  const org = await findOrgBySlug(orgSlug);
  if (!org) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Server-side auth guard (redirects if not authed)
  await requireAdminSession(org.id, orgSlug);

  const formData = await req.formData();

  const name = String(formData.get("name") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const isPublic = formData.get("is_public") === "on";

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Retry token generation on the extremely unlikely collision
  let publicToken = generatePublicToken();
  for (let i = 0; i < 3; i++) {
    const exists = await prisma.asset.findUnique({
      where: { public_token: publicToken },
      select: { id: true },
    });
    if (!exists) break;
    publicToken = generatePublicToken();
  }

  await prisma.asset.create({
    data: {
      org_id: org.id,
      public_token: publicToken,
      name,
      location: location || null,
      notes: notes || null,
      is_public: isPublic,
    },
  });

  // Redirect back to assets list
  return NextResponse.redirect(new URL(`/o/${orgSlug}/admin/assets`, req.url), {
    status: 303,
  });
}

