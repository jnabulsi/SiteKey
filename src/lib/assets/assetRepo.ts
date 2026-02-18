import { prisma } from "@/lib/db/prisma";

/**
 * Resolve an asset by its public QR token.
 * Returns the asset including org_id.
 * Returns null if not found.
 */
export async function findAssetByPublicToken(token: string) {
  if (!token) return null;

  return prisma.asset.findUnique({
    where: { public_token: token },
  });
}

export async function countAssetsForOrg(orgId: string): Promise<number> {
  return prisma.asset.count({ where: { org_id: orgId } });
}
