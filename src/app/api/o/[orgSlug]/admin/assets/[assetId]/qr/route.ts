import QRCode from "qrcode";
import { prisma } from "@/lib/db/prisma";
import { findOrgBySlug } from "@/lib/org/orgRepo";
import { requireAdminSession } from "@/lib/auth/requireAdminSession";
import { env } from "@/env";

export async function GET(
  _req: Request,
  props: { params: Promise<{ orgSlug: string; assetId: string }> }
) {
  const { orgSlug, assetId } = await props.params;

  const org = await findOrgBySlug(orgSlug);
  if (!org) return new Response("Not found", { status: 404 });

  await requireAdminSession(org.id, orgSlug);

  const asset = await prisma.asset.findFirst({
    where: { id: assetId, org_id: org.id },
    select: { public_token: true, name: true },
  });
  if (!asset) return new Response("Not found", { status: 404 });

  const url = `${env.PUBLIC_BASE_URL}/a/${asset.public_token}`;
  const buffer = await QRCode.toBuffer(url, { width: 800, margin: 2 });

  const safeName = asset.name
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 50);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="qr-${safeName}.png"`,
    },
  });
}
