import { NextResponse } from "next/server";
import { z } from "zod";
import { findOrgBySlug } from "@/lib/org/orgRepo";
import { requireAdminSessionApi } from "@/lib/auth/requireAdminSessionApi";
import { prisma } from "@/lib/db/prisma";
import { createUploadingDocument, countDocumentsForAsset, countDocumentsForOrg } from "@/lib/documents/documentRepo";
import { presignPutObject } from "@/lib/s3/server";

const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

const bodySchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.literal("application/pdf"),
  sizeBytes: z.number().int().positive().max(MAX_SIZE_BYTES),
  title: z.string().min(1).max(200).optional(),
  docType: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

function safeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 100);
}

export async function POST(
  req: Request,
  props: { params: Promise<{ orgSlug: string; assetId: string }> }
) {
  const { orgSlug, assetId } = await props.params;

  const org = await findOrgBySlug(orgSlug);
  if (!org) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await requireAdminSessionApi(org.id);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify asset belongs to org
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, org_id: org.id },
    select: { id: true },
  });
  if (!asset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Enforce per-asset document limit
  const docCount = await countDocumentsForAsset(assetId);
  if (docCount >= org.max_documents_per_asset) {
    return NextResponse.json(
      { error: `Document limit reached (${org.max_documents_per_asset} max per asset)` },
      { status: 403 }
    );
  }

  // Enforce org-wide document limit
  const totalDocs = await countDocumentsForOrg(org.id);
  if (totalDocs >= org.max_total_documents) {
    return NextResponse.json(
      { error: `Organisation document limit reached (${org.max_total_documents} max)` },
      { status: 403 }
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const title = body.title || body.filename.replace(/\.pdf$/i, "");

  const document = await createUploadingDocument({
    orgId: org.id,
    assetId: asset.id,
    title,
    filename: body.filename,
    contentType: body.contentType,
    sizeBytes: body.sizeBytes,
    storageKey: "", // placeholder, set below
    docType: body.docType ?? null,
    notes: body.notes ?? null,
  });

  const timestamp = Date.now();
  const storageKey = `org/${org.id}/asset/${asset.id}/doc/${document.id}/${timestamp}-${safeFilename(body.filename)}`;

  // Update the document with the final storage key
  await prisma.document.update({
    where: { id: document.id },
    data: { storage_key: storageKey },
  });

  const presignedUrl = await presignPutObject(
    storageKey,
    body.contentType,
    body.sizeBytes
  );

  return NextResponse.json(
    {
      documentId: document.id,
      storageKey,
      presignedUrl,
    },
    { status: 200 }
  );
}
