import { NextResponse } from "next/server";
import {
  findOrphanedUploads,
  deleteDocumentById,
} from "@/lib/documents/documentRepo";
import { deleteObject } from "@/lib/s3/server";

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

  return NextResponse.json({ found: orphans.length, deleted, errors });
}
