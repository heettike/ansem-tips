import { config } from "./config";
import { decideWhetherToPay } from "./tip-policy";
import type { ActionType, TwitterAction } from "../types";

export type EnqueueTipper = {
  id: string;
  xId: string;
  walletAddress: string | null;
  tipsArmedAt: Date | null;
  followBaselineAt: Date | null;
  tipSettings: {
    likeAmount: number;
    commentAmount: number;
    followAmount: number;
    quoteAmount: number;
    superTipAmount: number;
  };
};

export type EnqueueStore = {
  hasProcessed(actionId: string): Promise<boolean>;
  markProcessed(row: {
    actionId: string;
    actionType: string;
    tipperXId: string;
  }): Promise<"created" | "duplicate">;
  upsertRecipient(row: {
    xId: string;
    username: string;
  }): Promise<{ id: string }>;
  createTip(row: {
    actionType: ActionType;
    actionId: string;
    fromUserId: string;
    toUserId?: string;
    toXUsername: string;
    toXId?: string;
    amount: number;
    metadata: string;
  }): Promise<void>;
  setFollowBaselineAt(userId: string, at: Date): Promise<void>;
};

export type EnqueueResult = {
  enqueued: number;
  skipped: number;
  baselined: number;
  actions: string[];
};

function resolveActionType(action: TwitterAction): ActionType {
  if (
    (action.actionType === "comment" || action.actionType === "quote") &&
    (action.hasBullEmoji || (action.text && action.text.includes("🐂")))
  ) {
    return "super_tip";
  }
  return action.actionType;
}

function amountFor(
  settings: EnqueueTipper["tipSettings"],
  actionType: ActionType
): number {
  switch (actionType) {
    case "like":
      return settings.likeAmount;
    case "comment":
      return settings.commentAmount;
    case "follow":
      return settings.followAmount;
    case "quote":
      return settings.quoteAmount;
    case "super_tip":
      return settings.superTipAmount;
  }
}

/**
 * Dedupe via ProcessedAction, then pay only post-arm actions.
 * First follow pass after arming (followBaselineAt unset): record all current
 * follows as seen, pay zero, then stamp followBaselineAt.
 */
export async function enqueueFetchedActions(opts: {
  tipper: EnqueueTipper;
  actions: TwitterAction[];
  store: EnqueueStore;
  now?: Date;
}): Promise<EnqueueResult> {
  const { tipper, actions, store } = opts;
  const now = opts.now ?? new Date();

  let enqueued = 0;
  let skipped = 0;
  let baselined = 0;
  const paidActions: string[] = [];
  let sawFollow = false;

  for (const action of actions) {
    if (await store.hasProcessed(action.actionId)) {
      skipped++;
      if (action.actionType === "follow") sawFollow = true;
      continue;
    }

    const actionType = resolveActionType(action);

    const marked = await store.markProcessed({
      actionId: action.actionId,
      actionType,
      tipperXId: tipper.xId,
    });
    if (marked === "duplicate") {
      skipped++;
      continue;
    }

    if (action.actionType === "follow") sawFollow = true;

    const decision = decideWhetherToPay({
      actionType: action.actionType,
      createdAt: action.createdAt,
      createdAtIsSynthetic: action.createdAtIsSynthetic,
      tipsArmedAt: tipper.tipsArmedAt,
      walletAddress: tipper.walletAddress,
      followBaselineAt: tipper.followBaselineAt,
    });

    if (!decision.pay) {
      baselined++;
      continue;
    }

    const amount = Math.max(config.minTipUsd, amountFor(tipper.tipSettings, actionType));

    let toUserId: string | undefined;
    if (action.targetXId) {
      const recipient = await store.upsertRecipient({
        xId: action.targetXId,
        username: action.targetUsername,
      });
      toUserId = recipient.id;
    } else if (action.targetUsername && action.targetUsername !== "unknown") {
      const recipient = await store.upsertRecipient({
        xId: `uname_${action.targetUsername.toLowerCase()}`,
        username: action.targetUsername.toLowerCase(),
      });
      toUserId = recipient.id;
    }

    await store.createTip({
      actionType,
      actionId: action.actionId,
      fromUserId: tipper.id,
      toUserId,
      toXUsername: action.targetUsername,
      toXId: action.targetXId,
      amount,
      metadata: JSON.stringify({ text: action.text ?? null }),
    });

    enqueued++;
    paidActions.push(action.actionId);
  }

  if (!tipper.followBaselineAt && sawFollow && tipper.tipsArmedAt) {
    await store.setFollowBaselineAt(tipper.id, now);
    tipper.followBaselineAt = now;
  }

  return { enqueued, skipped, baselined, actions: paidActions };
}
