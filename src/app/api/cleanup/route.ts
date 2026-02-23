import { NextResponse } from "next/server";
import {
  findOrphanedUploads,
  deleteDocumentById,
} from "@/lib/documents/documentRepo";
import { deleteObject } from "@/lib/s3/server";
import { deleteExpiredSessions } from "@/lib/auth/sessionRepo";
import { deleteExpiredOrganisations } from "@/lib/org/orgRepo";

const ORPHAN_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orphans = await findOrphanedUploads(ORPHAN_MAX_AGE_MS);

  let deleted = 0;
  const errors: string[] = [];

  for (const doc of orphans) {
    try {
      if (doc.storage_key) {
        await deleteObject(doc.storage_key).catch(() => {});
      }
      await deleteDocumentById(doc.id);
      deleted++;
    } catch (err) {
      errors.push(`${doc.id}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  const expiredSessions = await deleteExpiredSessions();

  // Delete expired demo orgs (cascade deletes assets, documents, sessions).
  // Demo documents point to shared demo/ S3 keys — no S3 deletion needed.
  const expiredOrgs = await deleteExpiredOrganisations();

  return NextResponse.json({
    orphanedDocuments: { found: orphans.length, deleted, errors },
    expiredSessions: { deleted: expiredSessions },
    expiredOrganisations: { deleted: expiredOrgs },
  });
}
