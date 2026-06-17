import { db } from "@/lib/db";

// Postgres-backed fixed-window rate limiter. Two windows guard /api/lyrics:
// a burst window (per-minute) and a daily window whose size depends on
// whether the user has ever purchased credits. Cost protection lives in the
// daily cap; the burst cap just blunts scripted loops.

export const LYRICS_LIMITS = {
  perMinute: 10,
  perDayFree: 15,
  perDayPaid: 100,
} as const;

export interface RateLimitResult {
  ok: boolean;
  /** Remaining calls in the tightest window (0 when blocked). */
  remaining: number;
  /** Seconds until the blocked window resets. Only set when ok is false. */
  retryAfterSeconds?: number;
}

/**
 * Count one hit against a fixed window. Atomic via upsert increment —
 * concurrent requests can't slip under the limit.
 */
async function hitWindow(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ ok: boolean; remaining: number; retryAfterSeconds: number }> {
  const now = Date.now();
  const bucket = Math.floor(now / (windowSeconds * 1000));
  const windowEnd = (bucket + 1) * windowSeconds * 1000;
  const bucketKey = `${key}:${bucket}`;

  const row = await db.rateLimit.upsert({
    where: { key: bucketKey },
    create: { key: bucketKey, count: 1, expiresAt: new Date(windowEnd) },
    update: { count: { increment: 1 } },
  });

  return {
    ok: row.count <= limit,
    remaining: Math.max(0, limit - row.count),
    retryAfterSeconds: Math.ceil((windowEnd - now) / 1000),
  };
}

/**
 * Enforce lyrics-generation limits for a user. Call at the top of
 * POST /api/lyrics; on ok=false return 429 with Retry-After.
 */
export async function checkLyricsRateLimit(
  userId: string,
  opts: { paid: boolean },
): Promise<RateLimitResult> {
  const dailyLimit = opts.paid
    ? LYRICS_LIMITS.perDayPaid
    : LYRICS_LIMITS.perDayFree;

  const [minute, day] = await Promise.all([
    hitWindow(`lyrics:${userId}:m`, LYRICS_LIMITS.perMinute, 60),
    hitWindow(`lyrics:${userId}:d`, dailyLimit, 86400),
  ]);

  // Opportunistic cleanup of expired windows (~1% of calls).
  if (Math.random() < 0.01) {
    db.rateLimit
      .deleteMany({ where: { expiresAt: { lt: new Date() } } })
      .catch(() => {});
  }

  if (!minute.ok || !day.ok) {
    const blocked = !day.ok ? day : minute;
    return { ok: false, remaining: 0, retryAfterSeconds: blocked.retryAfterSeconds };
  }
  return { ok: true, remaining: Math.min(minute.remaining, day.remaining) };
}

/** True if the user has ever bought a credit pack (unlocks the paid daily cap). */
export async function isPayingUser(userId: string): Promise<boolean> {
  const tx = await db.transaction.findFirst({
    where: { userId },
    select: { id: true },
  });
  return tx !== null;
}
