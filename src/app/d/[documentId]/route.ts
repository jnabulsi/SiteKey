import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { presignGetObject } from "@/lib/s3/server";
import { getSession } from "@/lib/auth/getSession";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;

  if (!documentId) return new Response(null, { status: 404 });

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      asset: { select: { org_id: true, is_public: true } },
    },
  });

  if (!doc || !doc.asset) return new Response(null, { status: 404 });
  if (doc.upload_status !== "ready") return new Response(null, { status: 404 });

  let allowed = doc.asset.is_public;
  if (!allowed) {
    const session = await getSession();
    allowed = !!session && session.org_id === doc.asset.org_id;
  }
  if (!allowed) return new Response(null, { status: 404 });

  try {
    const url = await presignGetObject(doc.storage_key);
    return NextResponse.redirect(url);
  } catch (err) {
    console.error("presign failed", { documentId, orgId: doc.asset.org_id, err });
    return new Response("Internal Server Error", { status: 500 });
  }
}

