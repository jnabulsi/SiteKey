/**
 * Upload sample demo PDFs to S3.
 *
 * Run once:
 *   npx dotenv-cli -- npx tsx scripts/upload-demo-pdfs.ts
 *
 * Creates minimal valid PDFs and uploads them to the demo/ prefix in S3.
 * These are shared across all demo orgs — never deleted by the cleanup cron.
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const REGION = process.env.AWS_REGION!;
const BUCKET = process.env.AWS_S3_BUCKET!;

const s3 = new S3Client({ region: REGION });

/** Generate a minimal valid PDF with a title and body text. */
function makePdf(title: string, body: string): Buffer {
  // Minimal PDF 1.4 with a single page of text
  const stream = [
    "%PDF-1.4",
    "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj",
    "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj",
    "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj",
    `4 0 obj<</Length ${contentLength(title, body)}>>stream`,
    pageContent(title, body),
    "endstream endobj",
    "5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj",
  ];

  const xref = buildXref(stream);
  const full = [...stream, xref].join("\n");
  return Buffer.from(full, "ascii");
}

function pageContent(title: string, body: string): string {
  const lines = [
    "BT",
    "/F1 24 Tf",
    "72 700 Td",
    `(${escapePdf(title)}) Tj`,
    "/F1 12 Tf",
    "0 -36 Td",
    `(${escapePdf(body)}) Tj`,
    "ET",
  ];
  return lines.join("\n");
}

function contentLength(title: string, body: string): number {
  return Buffer.byteLength(pageContent(title, body), "ascii");
}

function escapePdf(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildXref(lines: string[]): string {
  let offset = 0;
  const offsets: number[] = [];
  for (const line of lines) {
    if (/^\d+ 0 obj/.test(line)) {
      offsets.push(offset);
    }
    offset += Buffer.byteLength(line, "ascii") + 1; // +1 for newline
  }

  const xrefStart = offset;
  const parts = [
    "xref",
    `0 ${offsets.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n `),
    "trailer",
    `<</Size ${offsets.length + 1}/Root 1 0 R>>`,
    "startxref",
    String(xrefStart),
    "%%EOF",
  ];
  return parts.join("\n");
}

const DEMO_PDFS = [
  {
    key: "demo/wiring-diagram.pdf",
    title: "Wiring Diagram — MSB-01",
    body: "Sample wiring diagram for Main Switchboard. This is a demo document.",
  },
  {
    key: "demo/maintenance-schedule.pdf",
    title: "Maintenance Schedule — Q1 2026",
    body: "Quarterly maintenance checklist. This is a demo document.",
  },
  {
    key: "demo/safety-datasheet.pdf",
    title: "Safety Data Sheet — Fire Pump System",
    body: "Emergency procedures and safety information. This is a demo document.",
  },
];

async function exists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log(`Uploading demo PDFs to s3://${BUCKET}/demo/\n`);

  for (const pdf of DEMO_PDFS) {
    const already = await exists(pdf.key);
    if (already) {
      console.log(`  SKIP  ${pdf.key} (already exists)`);
      continue;
    }

    const body = makePdf(pdf.title, pdf.body);
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: pdf.key,
        Body: body,
        ContentType: "application/pdf",
      })
    );
    console.log(`  PUT   ${pdf.key} (${body.length} bytes)`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
