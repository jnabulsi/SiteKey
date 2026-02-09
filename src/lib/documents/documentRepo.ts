import { prisma } from "@/lib/db/prisma";

export async function listReadyDocumentsForAsset(assetId: string) {
  return prisma.document.findMany({
    where: {
      asset_id: assetId,
      upload_status: "ready",
    },
    orderBy: { uploaded_at: "desc" },
    select: {
      id: true,
      title: true,
      doc_type: true,
      notes: true,
      uploaded_at: true,
    },
  });
}

export async function createUploadingDocument(data: {
  orgId: string;
  assetId: string;
  title: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  storageKey: string;
  docType?: string | null;
  notes?: string | null;
}) {
  return prisma.document.create({
    data: {
      org_id: data.orgId,
      asset_id: data.assetId,
      title: data.title,
      filename: data.filename,
      content_type: data.contentType,
      size_bytes: data.sizeBytes,
      storage_key: data.storageKey,
      doc_type: data.docType ?? null,
      notes: data.notes ?? null,
      upload_status: "uploading",
    },
  });
}

export async function finalizeDocument(documentId: string, orgId: string) {
  return prisma.document.updateMany({
    where: {
      id: documentId,
      org_id: orgId,
      upload_status: "uploading",
    },
    data: {
      upload_status: "ready",
      uploaded_at: new Date(),
    },
  });
}

export async function findDocumentByIdAndOrg(
  documentId: string,
  orgId: string
) {
  return prisma.document.findFirst({
    where: { id: documentId, org_id: orgId },
  });
}

