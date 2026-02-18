import { prisma } from "@/lib/db/prisma";

const CLEANUP_PROBABILITY = 0.05; // 1 in 20 calls

export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  // Opportunistic cleanup
  if (Math.random() < CLEANUP_PROBABILITY) {
    cleanupOldAttempts(windowMs).catch(() => {});
  }

  const windowStart = new Date(Date.now() - windowMs);

  const count = await prisma.rateLimitAttempt.count({
    where: { key, created_at: { gt: windowStart } },
  });

  if (count >= maxAttempts) {
    // Find the oldest attempt in the window to calculate retry time
    const oldest = await prisma.rateLimitAttempt.findFirst({
      where: { key, created_at: { gt: windowStart } },
      orderBy: { created_at: "asc" },
      select: { created_at: true },
    });

    const retryAfterMs = oldest
      ? oldest.created_at.getTime() + windowMs - Date.now()
      : windowMs;

    return { allowed: false, retryAfterMs };
  }

  await prisma.rateLimitAttempt.create({ data: { key } });
  return { allowed: true };
}

export async function cleanupOldAttempts(maxAgeMs: number): Promise<void> {
  const cutoff = new Date(Date.now() - maxAgeMs);
  await prisma.rateLimitAttempt.deleteMany({
    where: { created_at: { lt: cutoff } },
  });
}
