import { prisma } from "@/lib/db/prisma";
import { FIELD_SESSION_TTL_DAYS } from "@/lib/auth/constants";
import { generateSessionToken, hashSessionToken } from "@/lib/auth/tokens";

export type SessionType = "field" | "admin";

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function createSession(args: {
  orgId: string;
  sessionType: SessionType;
  ttlDays: number;
}): Promise<{ rawToken: string; expiresAt: Date }> {
  const rawToken = generateSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  const now = new Date();
  const expiresAt = addDays(now, args.ttlDays);

  await prisma.session.create({
    data: {
      org_id: args.orgId,
      session_token_hash: tokenHash,
      session_type: args.sessionType,
      expires_at: expiresAt,
      last_seen_at: now,
    },
  });

  // Fire-and-forget: prune expired sessions for this org
  prisma.session
    .deleteMany({
      where: { org_id: args.orgId, expires_at: { lt: now } },
    })
    .catch(() => {});

  return { rawToken, expiresAt };
}

export async function createFieldSession(orgId: string) {
  return createSession({
    orgId,
    sessionType: "field",
    ttlDays: FIELD_SESSION_TTL_DAYS,
  });
}

export async function createAdminSession(orgId: string) {
  return createSession({
    orgId,
    sessionType: "admin",
    ttlDays: FIELD_SESSION_TTL_DAYS,
  });
}

export async function findValidSessionByRawToken(rawToken: string) {
  const tokenHash = hashSessionToken(rawToken);
  const session = await prisma.session.findUnique({
    where: { session_token_hash: tokenHash },
  });

  if (!session) return null;

  if (session.expires_at <= new Date()) return null;

  return session;
}

