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

    return NextResponse.redirect(new URL(`/o/${encodeURIComponent(orgSlug)}/admin/assets`, req.url), {
      status: 303,
    });
  }

  // default: update
  const name = String(formData.get("name") ?? "").trim().slice(0, 200);
  const location = String(formData.get("location") ?? "").trim().slice(0, 200);
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 2000);
  const isPublic = formData.get("is_public") === "on";

  if (!name) {
    const url = new URL(
      `/o/${encodeURIComponent(orgSlug)}/admin/assets/${encodeURIComponent(assetId)}`,
      req.url
    );
    url.searchParams.set("error", "name");
    return NextResponse.redirect(url, { status: 303 });
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

  return NextResponse.redirect(new URL(`/o/${encodeURIComponent(orgSlug)}/admin/assets`, req.url), {
    status: 303,
  });
}

