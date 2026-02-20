import { prisma } from "@/lib/db/prisma";

export async function countDocumentsForAsset(assetId: string): Promise<number> {
  return prisma.document.count({ where: { asset_id: assetId } });
}

export async function countDocumentsForOrg(orgId: string): Promise<number> {
  return prisma.document.count({ where: { org_id: orgId } });
}

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

export async function updateDocumentMetadata(
  documentId: string,
  orgId: string,
  data: { title?: string; docType?: string; notes?: string }
) {
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.docType !== undefined) updateData.doc_type = data.docType;
  if (data.notes !== undefined) updateData.notes = data.notes;

  return prisma.document.updateMany({
    where: { id: documentId, org_id: orgId, upload_status: "ready" },
    data: updateData,
  });
}

export async function deleteDocument(documentId: string, orgId: string) {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, org_id: orgId },
    select: { id: true, storage_key: true },
  });
  if (!doc) return null;

  await prisma.document.delete({ where: { id: doc.id } });
  return doc.storage_key;
}

export async function setDocumentReplacing(documentId: string, orgId: string) {
  return prisma.document.updateMany({
    where: { id: documentId, org_id: orgId, upload_status: "ready" },
    data: { upload_status: "replacing" },
  });
}

export async function findOrphanedUploads(maxAgeMs: number) {
  const cutoff = new Date(Date.now() - maxAgeMs);
  return prisma.document.findMany({
    where: {
      upload_status: { in: ["uploading", "replacing"] },
      uploaded_at: { lt: cutoff },
    },
    select: { id: true, storage_key: true },
  });
}

export async function deleteDocumentById(documentId: string) {
  return prisma.document.delete({ where: { id: documentId } });
}

export async function finalizeReplaceDocument(
  documentId: string,
  orgId: string,
  data: { storageKey: string; filename: string; sizeBytes: number }
) {
  return prisma.document.updateMany({
    where: { id: documentId, org_id: orgId, upload_status: "replacing" },
    data: {
      storage_key: data.storageKey,
      filename: data.filename,
      size_bytes: data.sizeBytes,
      upload_status: "ready",
      uploaded_at: new Date(),
    },
  });
}

