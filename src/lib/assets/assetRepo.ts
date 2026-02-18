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

export async function findAssetsForOrg(
  orgId: string,
  opts?: {
    search?: string;
    visibility?: "public" | "private";
    sort?: "name-asc" | "name-desc" | "created-asc" | "created-desc";
  },
) {
  const where: {
    org_id: string;
    is_public?: boolean;
    name?: { contains: string; mode: "insensitive" };
  } = { org_id: orgId };

  if (opts?.visibility === "public") where.is_public = true;
  if (opts?.visibility === "private") where.is_public = false;
  if (opts?.search) where.name = { contains: opts.search, mode: "insensitive" };

  const orderBy = (() => {
    switch (opts?.sort) {
      case "name-asc":
        return { name: "asc" as const };
      case "name-desc":
        return { name: "desc" as const };
      case "created-asc":
        return { created_at: "asc" as const };
      case "created-desc":
      default:
        return { created_at: "desc" as const };
    }
  })();

  return prisma.asset.findMany({
    where,
    orderBy,
    include: { _count: { select: { documents: true } } },
  });
}
