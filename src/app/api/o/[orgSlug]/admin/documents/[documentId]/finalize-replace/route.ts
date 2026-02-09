import { NextResponse } from "next/server";
import { z } from "zod";
import { findOrgBySlug } from "@/lib/org/orgRepo";
import { requireAdminSessionApi } from "@/lib/auth/requireAdminSessionApi";
import {
  findDocumentByIdAndOrg,
  finalizeReplaceDocument,
} from "@/lib/documents/documentRepo";
import { headObject, deleteObject } from "@/lib/s3/server";

const bodySchema = z.object({
  newStorageKey: z.string().min(1),
  oldStorageKey: z.string().min(1),
  filename: z.string().min(1).max(255),
  sizeBytes: z.number().int().positive(),
});

export async function POST(
  req: Request,
  props: { params: Promise<{ orgSlug: string; documentId: string }> }
) {
  const { orgSlug, documentId } = await props.params;

  const org = await findOrgBySlug(orgSlug);
  if (!org) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await requireAdminSessionApi(org.id);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const doc = await findDocumentByIdAndOrg(documentId, org.id);
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (doc.upload_status !== "replacing") {
    return NextResponse.json(
      { error: "Document is not being replaced" },
      { status: 409 }
    );
  }

  if (doc.storage_key !== body.oldStorageKey) {
    return NextResponse.json(
      { error: "Storage key mismatch" },
      { status: 400 }
    );
  }

  // Verify the new file landed in S3
  try {
    await headObject(body.newStorageKey);
  } catch {
    return NextResponse.json(
      { error: "File not found in storage. Upload may still be in progress." },
      { status: 409 }
    );
  }

  const result = await finalizeReplaceDocument(documentId, org.id, {
    storageKey: body.newStorageKey,
    filename: body.filename,
    sizeBytes: body.sizeBytes,
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: "Document is not being replaced" },
      { status: 409 }
    );
  }

  // Best-effort delete old S3 object
  try {
    await deleteObject(body.oldStorageKey);
  } catch (err) {
    console.error("Failed to delete old S3 object:", body.oldStorageKey, err);
  }

  return NextResponse.json({
    documentId,
    storageKey: body.newStorageKey,
    status: "ready",
  });
}
