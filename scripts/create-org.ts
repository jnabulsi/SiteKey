import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/passwords";

const prisma = new PrismaClient();

async function main() {
  const name = process.argv[2];
  const slug = process.argv[3];
  const adminPassword = process.argv[4];
  const accessCode = process.argv[5];

  if (!name || !slug || !adminPassword || !accessCode) {
    console.error(
      "Usage: npx tsx scripts/create-org.ts <name> <slug> <admin-password> <access-code>"
    );
    console.error(
      'Example: npx tsx scripts/create-org.ts "Acme Corp" acme-corp secretpass fieldcode123'
    );
    process.exit(1);
  }

  const existing = await prisma.organisation.findUnique({ where: { slug } });
  if (existing) {
    console.error(`Organisation with slug "${slug}" already exists.`);
    process.exit(1);
  }

  const [adminPasswordHash, accessCodeHash] = await Promise.all([
    hashPassword(adminPassword),
    hashPassword(accessCode),
  ]);

  const org = await prisma.organisation.create({
    data: {
      name,
      slug,
      admin_password_hash: adminPasswordHash,
      access_code_hash: accessCodeHash,
    },
  });

  console.log(`Created organisation:`);
  console.log(`  ID:   ${org.id}`);
  console.log(`  Name: ${org.name}`);
  console.log(`  Slug: ${org.slug}`);
  console.log(`  Admin login: /o/${org.slug}/login`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
