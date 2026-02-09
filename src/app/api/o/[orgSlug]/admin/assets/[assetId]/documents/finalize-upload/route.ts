import { NextResponse } from "next/server";
import { z } from "zod";
import { findOrgBySlug } from "@/lib/org/orgRepo";
import { requireAdminSessionApi } from "@/lib/auth/requireAdminSessionApi";
import {
  findDocumentByIdAndOrg,
  finalizeDocument,
} from "@/lib/documents/documentRepo";
import { headObject } from "@/lib/s3/server";

const bodySchema = z.object({
  documentId: z.string().uuid(),
  storageKey: z.string().min(1),
});

export async function POST(
  req: Request,
  props: { params: Promise<{ orgSlug: string; assetId: string }> }
) {
  const { orgSlug } = await props.params;

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
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const document = await findDocumentByIdAndOrg(body.documentId, org.id);
  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (document.upload_status !== "uploading") {
    return NextResponse.json(
      { error: "Document already finalized" },
      { status: 409 }
    );
  }

  if (document.storage_key !== body.storageKey) {
    return NextResponse.json(
      { error: "Storage key mismatch" },
      { status: 400 }
    );
  }

  // Verify the file actually landed in S3
  try {
    await headObject(body.storageKey);
  } catch {
    return NextResponse.json(
      { error: "File not found in storage. Upload may still be in progress." },
      { status: 409 }
    );
  }

  const result = await finalizeDocument(body.documentId, org.id);
  if (result.count === 0) {
    return NextResponse.json(
      { error: "Document already finalized" },
      { status: 409 }
    );
  }

  return NextResponse.json(
    {
      documentId: document.id,
      title: document.title,
      status: "ready",
    },
    { status: 201 }
  );
}
