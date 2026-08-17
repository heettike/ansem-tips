import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  enqueueFetchedActions,
  type EnqueueStore,
  type EnqueueTipper,
} from "./enqueue-actions";
import type { TwitterAction } from "../types";

function follow(
  id: string,
  username: string,
  createdAt = new Date().toISOString()
): TwitterAction {
  return {
    actionId: `follow_tipper_${id}`,
    actionType: "follow",
    tipperXId: "x_tipper",
    tipperUsername: "heettike",
    targetXId: id,
    targetUsername: username,
    createdAt,
    createdAtIsSynthetic: true,
  };
}

function like(id: string, createdAt?: string): TwitterAction {
  return {
    actionId: `like_${id}`,
    actionType: "like",
    tipperXId: "x_tipper",
    tipperUsername: "heettike",
    targetXId: `author_${id}`,
    targetUsername: "someone",
    createdAt,
  };
}

function memoryStore() {
  const processed = new Set<string>();
  const tips: Array<{ actionId: string }> = [];
  let followBaselineAt: Date | null = null;

  const store: EnqueueStore = {
    async hasProcessed(actionId) {
      return processed.has(actionId);
    },
    async markProcessed(row) {
      if (processed.has(row.actionId)) return "duplicate";
      processed.add(row.actionId);
      return "created";
    },
    async upsertRecipient(row) {
      return { id: `user_${row.xId}` };
    },
    async createTip(row) {
      tips.push({ actionId: row.actionId });
    },
    async setFollowBaselineAt(_userId, at) {
      followBaselineAt = at;
    },
  };

  return {
    store,
    processed,
    tips,
    getFollowBaselineAt: () => followBaselineAt,
  };
}

function tipper(overrides: Partial<EnqueueTipper> = {}): EnqueueTipper {
  return {
    id: "tipper_1",
    xId: "x_tipper",
    walletAddress: "SoL111111111111111111111111111111111111111",
    tipsArmedAt: new Date("2026-08-13T02:32:00.000Z"),
    followBaselineAt: null,
    tipSettings: {
      likeAmount: 0.01,
      commentAmount: 0.01,
      followAmount: 0.01,
      quoteAmount: 0.01,
      superTipAmount: 0.05,
      commentTrigger: "lfg",
      superTipTrigger: "🐂",
    },
    ...overrides,
  };
}

describe("enqueueFetchedActions — never tip the past", () => {
  it("first poll of N existing follows → 0 tips enqueued, N processed", async () => {
    const mem = memoryStore();
    const existing = [
      follow("1", "gauravahuja"),
      follow("2", "deltaliquidity"),
      follow("3", "omen_xbt"),
      follow("4", "a"),
      follow("5", "b"),
      follow("6", "c"),
      follow("7", "d"),
      follow("8", "e"),
      follow("9", "f"),
    ];
    const t = tipper();
    const result = await enqueueFetchedActions({
      tipper: t,
      actions: existing,
      store: mem.store,
    });

    assert.equal(result.enqueued, 0);
    assert.equal(mem.tips.length, 0);
    assert.equal(mem.processed.size, 9);
    assert.ok(mem.getFollowBaselineAt(), "followBaselineAt stamped after baseline pass");
    assert.ok(t.followBaselineAt);
  });

  it("second poll with one new follow → 1 tip", async () => {
    const mem = memoryStore();
    const baselineAt = new Date("2026-08-13T02:33:00.000Z");
    const existing = [
      follow("1", "gauravahuja"),
      follow("2", "deltaliquidity"),
    ];
    const t = tipper({ followBaselineAt: null });
    await enqueueFetchedActions({
      tipper: t,
      actions: existing,
      store: mem.store,
      now: baselineAt,
    });
    assert.equal(mem.tips.length, 0);

    const result = await enqueueFetchedActions({
      tipper: t,
      actions: [...existing, follow("new", "freshfollow")],
      store: mem.store,
    });

    assert.equal(result.enqueued, 1);
    assert.deepEqual(result.actions, ["follow_tipper_new"]);
    assert.equal(mem.tips.length, 1);
    assert.equal(mem.processed.size, 3);
  });

  it("like with createdAt before tipsArmedAt → 0 tips", async () => {
    const mem = memoryStore();
    const armed = new Date("2026-08-13T02:32:00.000Z");
    const result = await enqueueFetchedActions({
      tipper: tipper({ tipsArmedAt: armed }),
      actions: [like("oldtweet", "2026-08-01T00:00:00.000Z")],
      store: mem.store,
    });
    assert.equal(result.enqueued, 0);
    assert.equal(mem.processed.size, 1);
    assert.equal(mem.tips.length, 0);
  });

  it("like with createdAt after tipsArmedAt → 1 tip", async () => {
    const mem = memoryStore();
    const armed = new Date("2026-08-13T02:32:00.000Z");
    const result = await enqueueFetchedActions({
      tipper: tipper({ tipsArmedAt: armed }),
      actions: [like("newtweet", "2026-08-13T03:00:00.000Z")],
      store: mem.store,
    });
    assert.equal(result.enqueued, 1);
    assert.equal(mem.tips.length, 1);
  });

  it("like missing created_at is recorded but not paid", async () => {
    const mem = memoryStore();
    const result = await enqueueFetchedActions({
      tipper: tipper(),
      actions: [like("notime")],
      store: mem.store,
    });
    assert.equal(result.enqueued, 0);
    assert.equal(mem.processed.size, 1);
  });

  it("first armed poll still pays zero for follows seen that pass, then a later poll pays a true new follow", async () => {
    const mem = memoryStore();
    await enqueueFetchedActions({
      tipper: tipper({ tipsArmedAt: null }),
      actions: [follow("1", "old")],
      store: mem.store,
    });
    const t = tipper({ followBaselineAt: null });
    const firstArmed = await enqueueFetchedActions({
      tipper: t,
      actions: [follow("1", "old"), follow("2", "during_gap")],
      store: mem.store,
    });
    assert.equal(firstArmed.enqueued, 0);
    assert.ok(t.followBaselineAt);

    const later = await enqueueFetchedActions({
      tipper: t,
      actions: [
        follow("1", "old"),
        follow("2", "during_gap"),
        follow("3", "real_new"),
      ],
      store: mem.store,
    });
    assert.equal(later.enqueued, 1);
    assert.deepEqual(later.actions, ["follow_tipper_3"]);
  });

  it("unarmed tipper baselines follows without enqueueing or stamping followBaselineAt", async () => {
    const mem = memoryStore();
    const result = await enqueueFetchedActions({
      tipper: tipper({ tipsArmedAt: null }),
      actions: [follow("1", "gauravahuja"), follow("2", "deltaliquidity")],
      store: mem.store,
    });
    assert.equal(result.enqueued, 0);
    assert.equal(mem.processed.size, 2);
    assert.equal(mem.getFollowBaselineAt(), null);
  });
});

function comment(id: string, text: string, createdAt = "2026-08-14T00:00:00.000Z"): TwitterAction {
  return {
    actionId: `comment_${id}`,
    actionType: "comment",
    tipperXId: "x_tipper",
    tipperUsername: "heettike",
    targetXId: `author_${id}`,
    targetUsername: "someone",
    text,
    hasBullEmoji: text.includes("🐂"),
    createdAt,
  };
}

describe("enqueueFetchedActions — lfg comment gate", () => {
  it("plain comment without lfg → processed, no tip", async () => {
    const mem = memoryStore();
    const result = await enqueueFetchedActions({
      tipper: tipper(),
      actions: [comment("1", "great post ser")],
      store: mem.store,
    });
    assert.equal(result.enqueued, 0);
    assert.equal(result.skipped, 1);
    assert.equal(mem.tips.length, 0);
    assert.ok(mem.processed.has("comment_1"));
  });

  it("lfg comment (any case) → tips", async () => {
    const mem = memoryStore();
    const result = await enqueueFetchedActions({
      tipper: tipper(),
      actions: [comment("2", "LFG brother"), comment("3", "lfggg")],
      store: mem.store,
    });
    assert.equal(result.enqueued, 2);
    assert.equal(mem.tips.length, 2);
  });

  it("bull emoji comment without lfg → super_tip still fires", async () => {
    const mem = memoryStore();
    const result = await enqueueFetchedActions({
      tipper: tipper(),
      actions: [comment("4", "insane 🐂")],
      store: mem.store,
    });
    assert.equal(result.enqueued, 1);
    assert.equal(mem.tips.length, 1);
  });
});

describe("enqueueFetchedActions — per-tipper triggers", () => {
  it("emoji-only comment trigger tips on emoji, not on lfg", async () => {
    const mem = memoryStore();
    const t = tipper();
    t.tipSettings = { ...t.tipSettings, commentTrigger: "🔥" };
    const result = await enqueueFetchedActions({
      tipper: t,
      actions: [comment("e1", "this 🔥"), comment("e2", "lfg brother")],
      store: mem.store,
    });
    assert.equal(result.enqueued, 1);
    assert.equal(mem.tips[0].actionId, "comment_e1");
  });

  it("custom super-tip trigger upgrades comments", async () => {
    const mem = memoryStore();
    const t = tipper();
    t.tipSettings = { ...t.tipSettings, superTipTrigger: "🚀" };
    const result = await enqueueFetchedActions({
      tipper: t,
      actions: [comment("s1", "to the moon 🚀")],
      store: mem.store,
    });
    assert.equal(result.enqueued, 1);
    assert.ok(mem.processed.has("comment_s1"));
  });
});
