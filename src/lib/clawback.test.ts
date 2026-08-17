import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  earliestFollowDumpIds,
  looksLikeSolanaSignature,
  planClawback,
  type ClawbackTip,
} from "./clawback";

function tip(partial: Partial<ClawbackTip> & Pick<ClawbackTip, "id" | "createdAt">): ClawbackTip {
  return {
    fromUserId: "tipper_1",
    toUserId: "recip_1",
    actionType: "follow",
    status: "completed",
    txSig: `ledger_${partial.id}`,
    amount: 0.01,
    ...partial,
  };
}

describe("earliestFollowDumpIds", () => {
  it("selects the same-second first-poll cluster and ignores later staggered follows", () => {
    const dumpAt = new Date("2026-08-13T02:32:43.000Z");
    const later = new Date("2026-08-13T04:00:00.000Z");
    const tips = [
      tip({ id: "a", createdAt: dumpAt }),
      tip({ id: "b", createdAt: dumpAt }),
      tip({ id: "c", createdAt: dumpAt }),
      tip({ id: "d", createdAt: dumpAt }),
      tip({ id: "e", createdAt: dumpAt }),
      tip({ id: "f", createdAt: dumpAt }),
      tip({ id: "g", createdAt: dumpAt }),
      tip({ id: "h", createdAt: dumpAt }),
      tip({ id: "i", createdAt: dumpAt }),
      tip({ id: "legit", createdAt: later }),
    ];
    const dump = earliestFollowDumpIds(tips);
    assert.equal(dump.size, 9);
    assert.equal(dump.has("legit"), false);
    assert.equal(dump.has("a"), true);
  });

  it("does not treat a single staggered follow as a dump", () => {
    const dump = earliestFollowDumpIds([
      tip({ id: "solo", createdAt: new Date("2026-08-13T04:00:01.000Z") }),
    ]);
    assert.equal(dump.size, 0);
  });
});

describe("planClawback", () => {
  it("voids ledger dump follows and skips real solana signatures", () => {
    const dumpAt = new Date("2026-08-13T02:32:43.000Z");
    const realSig = "5".repeat(88);
    const tips: ClawbackTip[] = [
      tip({ id: "ledger1", createdAt: dumpAt, txSig: "ledger_ledger1" }),
      tip({ id: "ledger2", createdAt: dumpAt, txSig: "ledger_ledger2" }),
      tip({
        id: "chain",
        createdAt: dumpAt,
        txSig: realSig,
      }),
      tip({
        id: "pendingDump",
        createdAt: dumpAt,
        status: "pending",
        txSig: null,
      }),
      tip({
        id: "later",
        createdAt: new Date("2026-08-13T05:00:00.000Z"),
        txSig: "ledger_later",
      }),
    ];
    const plan = planClawback(tips, new Map([["tipper_1", null]]));
    assert.deepEqual(
      plan.voidLedger.map((t) => t.id).sort(),
      ["ledger1", "ledger2"]
    );
    assert.deepEqual(
      plan.voidPending.map((t) => t.id),
      ["pendingDump"]
    );
    assert.equal(plan.reportOnchain.length, 1);
    assert.equal(plan.reportOnchain[0].id, "chain");
  });

  it("voids pending tips created before tipsArmedAt", () => {
    const armed = new Date("2026-08-13T03:00:00.000Z");
    const plan = planClawback(
      [
        tip({
          id: "oldPending",
          actionType: "like",
          status: "pending",
          txSig: null,
          createdAt: new Date("2026-08-13T02:00:00.000Z"),
        }),
      ],
      new Map([["tipper_1", armed]])
    );
    assert.deepEqual(
      plan.voidPending.map((t) => t.id),
      ["oldPending"]
    );
  });
});

describe("looksLikeSolanaSignature", () => {
  it("rejects ledger_ and demo_ prefixes", () => {
    assert.equal(looksLikeSolanaSignature("ledger_abc"), false);
    assert.equal(looksLikeSolanaSignature("demo_tip_1"), false);
    assert.equal(
      looksLikeSolanaSignature("5".repeat(88)),
      true
    );
  });
});
