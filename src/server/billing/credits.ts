import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { creditLedger, pharmacies } from "../db/schema";
import type { TenantContext } from "../tenant-context";

type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

export class InsufficientCreditsError extends Error {
  constructor(
    readonly required: number,
    readonly available: number,
  ) {
    super(`Insufficient credits: need ${required}, have ${available}`);
    this.name = "InsufficientCreditsError";
  }
}

export type LedgerEntry = {
  delta: number;
  reason: string;
  refType?: string;
  refId?: string;
};

/**
 * Locks the pharmacy row and returns its authoritative balance (SUM of the ledger).
 * Every ledger write goes through this lock, so concurrent reservations can't overspend.
 */
async function lockedBalance(tx: Tx, pharmacyId: string): Promise<number> {
  await tx
    .select({ id: pharmacies.id })
    .from(pharmacies)
    .where(eq(pharmacies.id, pharmacyId))
    .for("update");
  const [row] = await tx
    .select({ total: sql<string | null>`SUM(${creditLedger.delta})` })
    .from(creditLedger)
    .where(eq(creditLedger.pharmacyId, pharmacyId));
  return Number(row?.total ?? 0);
}

/**
 * Appends a ledger entry inside `tx` and refreshes the cached balance.
 * Past rows are never modified. Returns false when an entry with the same
 * (reason, refType, refId) already exists, which makes grants and refunds idempotent.
 * Negative entries require enough balance unless `allowNegative` is set.
 */
export async function appendLedger(
  tx: Tx,
  pharmacyId: string,
  entry: LedgerEntry,
  { allowNegative = false } = {},
): Promise<boolean> {
  const balance = await lockedBalance(tx, pharmacyId);
  if (entry.delta < 0 && !allowNegative && balance + entry.delta < 0) {
    throw new InsufficientCreditsError(-entry.delta, balance);
  }
  if (entry.refType && entry.refId) {
    const [dup] = await tx
      .select({ id: creditLedger.id })
      .from(creditLedger)
      .where(
        sql`${creditLedger.refType} = ${entry.refType} AND ${creditLedger.refId} = ${entry.refId} AND ${creditLedger.reason} = ${entry.reason}`,
      )
      .limit(1);
    if (dup) return false;
  }
  await tx.insert(creditLedger).values({
    id: crypto.randomUUID(),
    pharmacyId,
    delta: entry.delta,
    reason: entry.reason,
    refType: entry.refType ?? null,
    refId: entry.refId ?? null,
  });
  await tx
    .update(pharmacies)
    .set({ creditsBalance: balance + entry.delta })
    .where(eq(pharmacies.id, pharmacyId));
  return true;
}

export async function getBalance(ctx: TenantContext): Promise<number> {
  const [row] = await getDb()
    .select({ total: sql<string | null>`SUM(${creditLedger.delta})` })
    .from(creditLedger)
    .where(eq(creditLedger.pharmacyId, ctx.pharmacyId));
  return Number(row?.total ?? 0);
}

export async function listLedger(ctx: TenantContext, limit = 20) {
  return getDb()
    .select({
      id: creditLedger.id,
      delta: creditLedger.delta,
      reason: creditLedger.reason,
      refType: creditLedger.refType,
      refId: creditLedger.refId,
      createdAt: creditLedger.createdAt,
    })
    .from(creditLedger)
    .where(eq(creditLedger.pharmacyId, ctx.pharmacyId))
    .orderBy(desc(creditLedger.createdAt))
    .limit(limit);
}
