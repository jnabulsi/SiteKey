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

