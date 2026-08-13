import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { decideWhetherToPay, realCreatedAt } from "./tip-policy";

const armed = new Date("2026-08-13T02:32:43.000Z");
const wallet = "SoL111111111111111111111111111111111111111";

describe("realCreatedAt", () => {
  it("returns undefined instead of inventing now", () => {
    assert.equal(realCreatedAt(undefined), undefined);
    assert.equal(realCreatedAt(null), undefined);
    assert.equal(realCreatedAt("not-a-date"), undefined);
    assert.equal(realCreatedAt("2026-08-13T02:40:00.000Z"), "2026-08-13T02:40:00.000Z");
  });
});

describe("decideWhetherToPay", () => {
  it("does not pay when unarmed or missing wallet", () => {
    assert.deepEqual(
      decideWhetherToPay({
        actionType: "like",
        createdAt: "2026-08-13T03:00:00.000Z",
        tipsArmedAt: null,
        walletAddress: wallet,
        followBaselineAt: armed,
      }),
      { pay: false, reason: "unarmed" }
    );
    assert.deepEqual(
      decideWhetherToPay({
        actionType: "like",
        createdAt: "2026-08-13T03:00:00.000Z",
        tipsArmedAt: armed,
        walletAddress: null,
        followBaselineAt: armed,
      }),
      { pay: false, reason: "no_wallet" }
    );
  });

  it("does not pay likes before tipsArmedAt", () => {
    assert.deepEqual(
      decideWhetherToPay({
        actionType: "like",
        createdAt: "2026-08-13T02:00:00.000Z",
        tipsArmedAt: armed,
        walletAddress: wallet,
        followBaselineAt: armed,
      }),
      { pay: false, reason: "before_arm" }
    );
  });

  it("pays likes after tipsArmedAt", () => {
    assert.deepEqual(
      decideWhetherToPay({
        actionType: "like",
        createdAt: "2026-08-13T03:00:00.000Z",
        tipsArmedAt: armed,
        walletAddress: wallet,
        followBaselineAt: armed,
      }),
      { pay: true }
    );
  });

  it("fails closed when like/reply/quote has no real created_at", () => {
    assert.deepEqual(
      decideWhetherToPay({
        actionType: "like",
        createdAt: undefined,
        tipsArmedAt: armed,
        walletAddress: wallet,
        followBaselineAt: armed,
      }),
      { pay: false, reason: "no_created_at" }
    );
    assert.deepEqual(
      decideWhetherToPay({
        actionType: "quote",
        createdAt: new Date().toISOString(),
        createdAtIsSynthetic: true,
        tipsArmedAt: armed,
        walletAddress: wallet,
        followBaselineAt: armed,
      }),
      { pay: false, reason: "no_created_at" }
    );
  });

  it("never pays follows on the baseline pass even if createdAt is now", () => {
    assert.deepEqual(
      decideWhetherToPay({
        actionType: "follow",
        createdAt: new Date().toISOString(),
        createdAtIsSynthetic: true,
        tipsArmedAt: armed,
        walletAddress: wallet,
        followBaselineAt: null,
      }),
      { pay: false, reason: "follow_baseline" }
    );
  });

  it("pays a new follow only after followBaselineAt is set", () => {
    assert.deepEqual(
      decideWhetherToPay({
        actionType: "follow",
        createdAt: new Date().toISOString(),
        createdAtIsSynthetic: true,
        tipsArmedAt: armed,
        walletAddress: wallet,
        followBaselineAt: armed,
      }),
      { pay: true }
    );
  });
});
