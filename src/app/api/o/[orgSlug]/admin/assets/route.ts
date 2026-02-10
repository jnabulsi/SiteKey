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

  const isJson = req.headers.get("content-type")?.includes("application/json");

  let name: string;
  let location: string;
  let notes: string;
  let isPublic: boolean;

  if (isJson) {
    const body = await req.json();
    name = String(body.name ?? "").trim().slice(0, 200);
    location = String(body.location ?? "").trim().slice(0, 200);
    notes = String(body.notes ?? "").trim().slice(0, 2000);
    isPublic = body.is_public === true;
  } else {
    const formData = await req.formData();
    name = String(formData.get("name") ?? "").trim().slice(0, 200);
    location = String(formData.get("location") ?? "").trim().slice(0, 200);
    notes = String(formData.get("notes") ?? "").trim().slice(0, 2000);
    isPublic = formData.get("is_public") === "on";
  }

  if (!name) {
    if (isJson) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const url = new URL(`/o/${encodeURIComponent(orgSlug)}/admin/assets/new`, req.url);
    url.searchParams.set("error", "name");
    return NextResponse.redirect(url, { status: 303 });
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

  const asset = await prisma.asset.create({
    data: {
      org_id: org.id,
      public_token: publicToken,
      name,
      location: location || null,
      notes: notes || null,
      is_public: isPublic,
    },
  });

  if (isJson) {
    return NextResponse.json({ id: asset.id, name: asset.name, public_token: asset.public_token });
  }

  // Redirect back to assets list
  return NextResponse.redirect(new URL(`/o/${encodeURIComponent(orgSlug)}/admin/assets`, req.url), {
    status: 303,
  });
}

