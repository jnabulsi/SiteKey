import { prisma } from "@/lib/db/prisma";

export async function findOrgBySlug(slug: string) {
  if (!slug) return null;
  return prisma.organisation.findUnique({ where: { slug } });
}

