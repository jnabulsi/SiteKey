import { prisma } from "@/lib/db/prisma";

export async function findOrgBySlug(slug: string) {
  if (!slug) return null;
  return prisma.organisation.findUnique({ where: { slug } });
}

export async function checkSlugExists(slug: string): Promise<boolean> {
  const org = await prisma.organisation.findUnique({
    where: { slug },
    select: { id: true },
  });
  return org !== null;
}

export async function createOrganisation(data: {
  name: string;
  slug: string;
  adminPasswordHash: string;
  accessCodeHash: string;
}) {
  return prisma.organisation.create({
    data: {
      name: data.name,
      slug: data.slug,
      admin_password_hash: data.adminPasswordHash,
      access_code_hash: data.accessCodeHash,
    },
  });
}

