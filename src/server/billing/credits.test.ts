import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createTenant, hasDb } from "../../../test/db-fixtures";
import { getDb } from "../db/client";
import { pharmacies } from "../db/schema";
import { appendLedger, getBalance, InsufficientCreditsError, listLedger } from "./credits";
import { TRIAL_CREDITS } from "./plans";
import { getSubscription } from "./subscriptions";

async function cachedBalance(pharmacyId: string) {
  const [row] = await getDb()
    .select({ b: pharmacies.creditsBalance })
    .from(pharmacies)
    .where(eq(pharmacies.id, pharmacyId));
  return row?.b;
}

describe.skipIf(!hasDb)("credit ledger", () => {
  it("starts a trial with trial credits on onboarding", async () => {
    const ctx = await createTenant("trial");
    expect(await getBalance(ctx)).toBe(TRIAL_CREDITS);
    expect(await cachedBalance(ctx.pharmacyId)).toBe(TRIAL_CREDITS);
    const sub = await getSubscription(ctx);
    expect(sub).toMatchObject({ planId: "trial", status: "trialing" });
    expect(sub!.currentPeriodEnd.getTime()).toBeGreaterThan(Date.now());
  });

  it("refuses to go below zero and keeps the cache equal to the ledger sum", async () => {
    const ctx = await createTenant("spend");
    await expect(
      getDb().transaction((tx) =>
        appendLedger(tx, ctx.pharmacyId, { delta: -(TRIAL_CREDITS + 1), reason: "test.spend" }),
      ),
    ).rejects.toBeInstanceOf(InsufficientCreditsError);
    await getDb().transaction((tx) =>
      appendLedger(tx, ctx.pharmacyId, { delta: -10, reason: "test.spend" }),
    );
    expect(await getBalance(ctx)).toBe(TRIAL_CREDITS - 10);
    expect(await cachedBalance(ctx.pharmacyId)).toBe(TRIAL_CREDITS - 10);
  });

  it("is idempotent per (reason, reference)", async () => {
    const ctx = await createTenant("idem");
    const entry = { delta: 5, reason: "test.bonus", refType: "test", refId: ctx.pharmacyId };
    expect(await getDb().transaction((tx) => appendLedger(tx, ctx.pharmacyId, entry))).toBe(true);
    expect(await getDb().transaction((tx) => appendLedger(tx, ctx.pharmacyId, entry))).toBe(false);
    expect(await getBalance(ctx)).toBe(TRIAL_CREDITS + 5);
  });

  it("never shows another tenant's ledger", async () => {
    const a = await createTenant("ledger-a");
    const b = await createTenant("ledger-b");
    const rowsA = await listLedger(a);
    expect(rowsA.length).toBeGreaterThan(0);
    const idsB = new Set((await listLedger(b)).map((r) => r.id));
    expect(rowsA.some((r) => idsB.has(r.id))).toBe(false);
  });
});
