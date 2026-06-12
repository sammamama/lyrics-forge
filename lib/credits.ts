import { db } from "@/lib/db";

export class InsufficientCreditsError extends Error {
  constructor(userId: string) {
    super(`User ${userId} has insufficient credits`);
    this.name = "InsufficientCreditsError";
  }
}

export async function getBalance(userId: string): Promise<number> {
  const credits = await db.credits.findUnique({ where: { userId } });
  return credits?.balance ?? 0;
}

/**
 * Atomically deduct 1 credit. The conditional updateMany means the balance
 * can never go negative under concurrent requests — if the guard doesn't
 * match, nothing is decremented and InsufficientCreditsError is thrown.
 */
export async function deductCredit(userId: string): Promise<void> {
  const result = await db.credits.updateMany({
    where: { userId, balance: { gte: 1 } },
    data: { balance: { decrement: 1 } },
  });
  if (result.count === 0) {
    throw new InsufficientCreditsError(userId);
  }
}

/** Refund 1 credit (failed Suno render). Caller guards against double-refunds. */
export async function refundCredit(userId: string): Promise<void> {
  await db.credits.upsert({
    where: { userId },
    create: { userId, balance: 1 },
    update: { balance: { increment: 1 } },
  });
}

export async function addCredits(
  userId: string,
  amount: number,
): Promise<void> {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`Invalid credit amount: ${amount}`);
  }
  await db.credits.upsert({
    where: { userId },
    create: { userId, balance: amount },
    update: { balance: { increment: amount } },
  });
}
