import { NextResponse } from "next/server";
import { z } from "zod";
import { findOrgBySlug } from "@/lib/org/orgRepo";
import { requireAdminSessionApi } from "@/lib/auth/requireAdminSessionApi";
import {
  findDocumentByIdAndOrg,
  setDocumentReplacing,
} from "@/lib/documents/documentRepo";
import { presignPutObject } from "@/lib/s3/server";

const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

const bodySchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.literal("application/pdf"),
  sizeBytes: z.number().int().positive().max(MAX_SIZE_BYTES),
});

function safeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 100);
}

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
  if (!doc || doc.upload_status !== "ready") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await setDocumentReplacing(documentId, org.id);
  if (result.count === 0) {
    return NextResponse.json(
      { error: "Document is not in a replaceable state" },
      { status: 409 }
    );
  }

  const timestamp = Date.now();
  const newStorageKey = `org/${org.id}/asset/${doc.asset_id}/doc/${doc.id}/${timestamp}-${safeFilename(body.filename)}`;

  const presignedUrl = await presignPutObject(
    newStorageKey,
    body.contentType,
    body.sizeBytes
  );

  return NextResponse.json({
    documentId: doc.id,
    newStorageKey,
    oldStorageKey: doc.storage_key,
    presignedUrl,
    filename: body.filename,
    sizeBytes: body.sizeBytes,
  });
}
