import { NextResponse } from "next/server";
import { z } from "zod";
import { findOrgBySlug } from "@/lib/org/orgRepo";
import { requireAdminSessionApi } from "@/lib/auth/requireAdminSessionApi";
import {
  findDocumentByIdAndOrg,
  updateDocumentMetadata,
  deleteDocument,
} from "@/lib/documents/documentRepo";
import { deleteObject } from "@/lib/s3/server";

const patchSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    docType: z.string().max(100).optional(),
    notes: z.string().max(2000).optional(),
  })
  .refine((d) => d.title || d.docType !== undefined || d.notes !== undefined, {
    message: "At least one field required",
  });

export async function PATCH(
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

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const doc = await findDocumentByIdAndOrg(documentId, org.id);
  if (!doc || doc.upload_status !== "ready") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await updateDocumentMetadata(documentId, org.id, body);
  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: doc.id,
    title: body.title ?? doc.title,
    doc_type: body.docType ?? doc.doc_type,
    notes: body.notes ?? doc.notes,
  });
}

export async function DELETE(
  _req: Request,
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

  const storageKey = await deleteDocument(documentId, org.id);
  if (!storageKey) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await deleteObject(storageKey);
  } catch (err) {
    console.error("Failed to delete S3 object:", storageKey, err);
  }

  return new Response(null, { status: 204 });
}
