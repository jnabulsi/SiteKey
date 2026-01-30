import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { findOrgBySlug } from "@/lib/org/orgRepo";
import { requireAdminSession } from "@/lib/auth/requireAdminSession";

export async function POST(
  req: Request,
  props: { params: Promise<{ orgSlug: string; assetId: string }> }
) {
  const { orgSlug, assetId } = await props.params;

  const org = await findOrgBySlug(orgSlug);
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await requireAdminSession(org.id, orgSlug);

  const formData = await req.formData();
  const action = String(formData.get("action") ?? "");

  if (action === "delete") {
    const deleted = await prisma.asset.deleteMany({
      where: { id: assetId, org_id: org.id },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.redirect(new URL(`/o/${orgSlug}/admin/assets`, req.url), {
      status: 303,
    });
  }

  // default: update
  const name = String(formData.get("name") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const isPublic = formData.get("is_public") === "on";

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const updated = await prisma.asset.updateMany({
    where: { id: assetId, org_id: org.id },
    data: {
      name,
      location: location || null,
      notes: notes || null,
      is_public: isPublic,
    },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.redirect(new URL(`/o/${orgSlug}/admin/assets`, req.url), {
    status: 303,
  });
}

