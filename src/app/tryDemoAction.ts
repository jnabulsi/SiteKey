"use server";

import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { createAdminSession } from "@/lib/auth/sessionRepo";
import { hashPassword } from "@/lib/auth/passwords";
import { createDemoOrganisation, checkSlugExists } from "@/lib/org/orgRepo";
import { checkRateLimit } from "@/lib/rateLimit/rateLimit";
import { generatePublicToken } from "@/lib/assets/tokens";
import { prisma } from "@/lib/db/prisma";

const DEMO_RATE_MAX = 5;
const DEMO_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const DEMO_TTL_HOURS = 24;
const DEMO_PASSWORD = "demo1234";
const DEMO_ACCESS_CODE = "demo1234";

const DEMO_ASSETS = [
  {
    name: "Main Switchboard MSB-01",
    location: "Building A, Level 1",
    notes: "Primary distribution board — 400A main breaker",
    is_public: false,
    documents: [
      {
        title: "Wiring Diagram",
        doc_type: "Drawing",
        filename: "wiring-diagram.pdf",
        storage_key: "demo/wiring-diagram.pdf",
        notes: "Single-line diagram showing all outgoing circuits",
      },
      {
        title: "Maintenance Schedule",
        doc_type: "Schedule",
        filename: "maintenance-schedule.pdf",
        storage_key: "demo/maintenance-schedule.pdf",
        notes: "Quarterly thermal imaging and torque checks",
      },
    ],
  },
  {
    name: "Fire Pump #2",
    location: "Basement, Plant Room B",
    notes: "Diesel fire pump — 75kW, AS2941 compliant",
    is_public: true,
    documents: [
      {
        title: "Safety Data Sheet",
        doc_type: "Safety",
        filename: "safety-datasheet.pdf",
        storage_key: "demo/safety-datasheet.pdf",
        notes: "Emergency procedures and isolation points",
      },
    ],
  },
];

function generateDemoSlug(): string {
  const suffix = crypto.randomBytes(3).toString("hex"); // 6 hex chars
  return `demo-${suffix}`;
}

export async function tryDemo() {
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";

  const rl = await checkRateLimit(
    `demo-create:${ip}`,
    DEMO_RATE_MAX,
    DEMO_RATE_WINDOW_MS
  );
  if (!rl.allowed) redirect("/?error=rate_limit");

  // Generate a unique slug
  let slug = generateDemoSlug();
  for (let i = 0; i < 5; i++) {
    if (!(await checkSlugExists(slug))) break;
    slug = generateDemoSlug();
  }

  const expiresAt = new Date(Date.now() + DEMO_TTL_HOURS * 60 * 60 * 1000);

  const [adminPasswordHash, accessCodeHash] = await Promise.all([
    hashPassword(DEMO_PASSWORD),
    hashPassword(DEMO_ACCESS_CODE),
  ]);

  const org = await createDemoOrganisation({
    name: "Demo Organisation",
    slug,
    adminPasswordHash,
    accessCodeHash,
    expiresAt,
  });

  // Create assets and documents
  for (const assetDef of DEMO_ASSETS) {
    const asset = await prisma.asset.create({
      data: {
        org_id: org.id,
        public_token: generatePublicToken(),
        name: assetDef.name,
        location: assetDef.location,
        notes: assetDef.notes,
        is_public: assetDef.is_public,
      },
    });

    for (const docDef of assetDef.documents) {
      await prisma.document.create({
        data: {
          org_id: org.id,
          asset_id: asset.id,
          title: docDef.title,
          doc_type: docDef.doc_type,
          filename: docDef.filename,
          storage_key: docDef.storage_key,
          content_type: "application/pdf",
          upload_status: "ready",
          uploaded_at: new Date(),
        },
      });
    }
  }

  // Create admin session and set cookie
  const { rawToken, expiresAt: sessionExpiry } = await createAdminSession(
    org.id
  );
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: rawToken,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: sessionExpiry,
  });

  redirect(`/o/${encodeURIComponent(slug)}/admin`);
}
