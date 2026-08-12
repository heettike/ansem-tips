import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { createTwitterClient, hasBullEmoji } from "@/lib/twitter";
import {
  tipTransferFromHotWallet,
  withdrawFromHotWallet,
} from "@/lib/solana";
import { demoTxSig } from "@/lib/demo";
import type {
  ActionType,
  ProcessTipResult,
  TipAmountSettings,
  TwitterAction,
  WithdrawResult,
} from "@/types";

const LOW_BALANCE_THRESHOLD = 10; // $ansem units

function resolveActionType(action: TwitterAction): ActionType {
  if (
    (action.actionType === "comment" || action.actionType === "quote") &&
    (action.hasBullEmoji || hasBullEmoji(action.text))
  ) {
    return "super_tip";
  }
  return action.actionType;
}

function amountFor(
  settings: {
    likeAmount: number;
    commentAmount: number;
    followAmount: number;
    quoteAmount: number;
    superTipAmount: number;
  },
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
 * Poll tipper actions from X, enqueue tips, never double-process action_ids.
 */
export async function pollAndEnqueueTips(tipperUsername?: string): Promise<{
  polled: number;
  enqueued: number;
  skipped: number;
  actions: string[];
}> {
  const username = (
    tipperUsername ||
    config.tipperAllowlist[0] ||
    "heettike"
  ).replace(/^@/, "");

  const twitter = createTwitterClient();
  const tipperUser = await twitter.getUserByUsername(username);
  if (!tipperUser) {
    throw new Error(`Tipper @${username} not found on X`);
  }

  const tipper = await prisma.user.upsert({
    where: { xId: tipperUser.id },
    create: {
      xId: tipperUser.id,
      username: tipperUser.username,
      role: "tipper",
      tipSettings: { create: {} },
      balance: {
        create: {
          deposited: config.demoMode ? 420.69 : 0,
        },
      },
    },
    update: { username: tipperUser.username },
    include: { tipSettings: true, balance: true },
  });

  if (!tipper.tipSettings?.enabled) {
    return { polled: 0, enqueued: 0, skipped: 0, actions: [] };
  }

  const [likes, replies, quotes, follows] = await Promise.all([
    twitter.listRecentLikes(tipperUser.id),
    twitter.listRecentReplies(tipperUser.id),
    twitter.listRecentQuotes(tipperUser.id),
    twitter.listRecentFollows(tipperUser.id),
  ]);

  const all = [...likes, ...replies, ...quotes, ...follows].map((a) => ({
    ...a,
    tipperUsername: tipperUser.username,
    tipperXId: tipperUser.id,
  }));

  let enqueued = 0;
  let skipped = 0;
  const actions: string[] = [];

  for (const action of all) {
    const existing = await prisma.processedAction.findUnique({
      where: { actionId: action.actionId },
    });
    if (existing) {
      skipped++;
      continue;
    }

    try {
      await prisma.processedAction.create({
        data: {
          actionId: action.actionId,
          actionType: resolveActionType(action),
          tipperXId: tipperUser.id,
        },
      });
    } catch {
      skipped++;
      continue;
    }

    const actionType = resolveActionType(action);
    const amount = Math.max(
      config.minTipUsd,
      amountFor(tipper.tipSettings, actionType)
    );

    let toUserId: string | undefined;
    if (action.targetXId) {
      const recipient = await prisma.user.upsert({
        where: { xId: action.targetXId },
        create: {
          xId: action.targetXId,
          username: action.targetUsername,
          role: "recipient",
          balance: { create: {} },
        },
        update: { username: action.targetUsername },
      });
      toUserId = recipient.id;
    } else if (action.targetUsername && action.targetUsername !== "unknown") {
      const recipient = await prisma.user.upsert({
        where: { xId: `uname_${action.targetUsername.toLowerCase()}` },
        create: {
          xId: `uname_${action.targetUsername.toLowerCase()}`,
          username: action.targetUsername.toLowerCase(),
          role: "recipient",
          balance: { create: {} },
        },
        update: {},
      });
      toUserId = recipient.id;
    }

    await prisma.tip.create({
      data: {
        actionType: actionType,
        actionId: action.actionId,
        fromUserId: tipper.id,
        toUserId,
        toXUsername: action.targetUsername,
        toXId: action.targetXId,
        amount,
        status: "pending",
        metadata: JSON.stringify({ text: action.text ?? null }),
      },
    });

    enqueued++;
    actions.push(action.actionId);
  }

  const bal = tipper.balance?.deposited ?? 0;
  if (bal < LOW_BALANCE_THRESHOLD) {
    await twitter.pingLowBalance(tipperUser.username, bal);
    console.warn(
      `[ALERT] Low tipper balance for @${tipperUser.username}: ${bal}`
    );
  }

  return { polled: all.length, enqueued, skipped, actions };
}

/**
 * Process a pending tip: debit tipper ledger, credit recipient withdrawable.
 * If recipient has a linked Solana wallet and HOT_WALLET_SECRET is set,
 * also perform an immediate SPL transfer from custody.
 */
export async function processTip(tipId: string): Promise<ProcessTipResult> {
  const tip = await prisma.tip.findUnique({
    where: { id: tipId },
    include: {
      fromUser: { include: { balance: true } },
      toUser: true,
    },
  });
  if (!tip) return { tipId, status: "failed", error: "Tip not found" };
  if (tip.status === "completed") {
    return { tipId, status: "completed", txSig: tip.txSig ?? undefined };
  }

  await prisma.tip.update({
    where: { id: tipId },
    data: { status: "processing" },
  });

  const deposited = tip.fromUser.balance?.deposited ?? 0;
  if (deposited < tip.amount) {
    await prisma.tip.update({
      where: { id: tipId },
      data: { status: "failed" },
    });
    const twitter = createTwitterClient();
    await twitter.pingLowBalance(tip.fromUser.username, deposited);
    console.warn(
      `[ALERT] Insufficient balance for tip ${tipId}: have ${deposited}, need ${tip.amount}`
    );
    return { tipId, status: "failed", error: "Insufficient tipper balance" };
  }

  let txSig: string | undefined;
  let onChain = false;

  // Immediate on-chain tip when recipient wallet is known + hot wallet configured
  if (tip.toUser?.walletAddress && !config.demoMode) {
    try {
      const transfer = await tipTransferFromHotWallet(
        tip.toUser.walletAddress,
        tip.amount
      );
      if (transfer) {
        txSig = transfer.signature;
        onChain = !transfer.demo;
      }
    } catch (e) {
      console.error("[tips] on-chain tip transfer failed; keeping ledger credit", e);
    }
  }

  if (!txSig) {
    txSig = config.demoMode ? demoTxSig("tip") : `ledger_${tipId}`;
  }

  await prisma.$transaction(async (tx) => {
    await tx.balance.update({
      where: { userId: tip.fromUserId },
      data: {
        deposited: { decrement: tip.amount },
        lifetimeSent: { increment: tip.amount },
      },
    });

    if (tip.toUserId) {
      // If already paid on-chain, do not leave withdrawable double-claim
      const withdrawableInc = onChain ? 0 : tip.amount;
      await tx.balance.upsert({
        where: { userId: tip.toUserId },
        create: {
          userId: tip.toUserId,
          withdrawable: withdrawableInc,
          lifetimeReceived: tip.amount,
        },
        update: {
          withdrawable: { increment: withdrawableInc },
          lifetimeReceived: { increment: tip.amount },
        },
      });
    }

    await tx.tip.update({
      where: { id: tipId },
      data: { status: "completed", txSig },
    });
  });

  return { tipId, status: "completed", txSig, onChain };
}

export async function processPendingTips(limit = 25): Promise<ProcessTipResult[]> {
  const pending = await prisma.tip.findMany({
    where: { status: "pending" },
    take: limit,
    orderBy: { createdAt: "asc" },
  });
  const results: ProcessTipResult[] = [];
  for (const tip of pending) {
    results.push(await processTip(tip.id));
  }
  return results;
}

/**
 * Recipient withdraw: debit withdrawable ledger, SPL transfer from hot wallet.
 */
export async function withdrawForUser(
  userId: string,
  toAddress: string,
  amount: number
): Promise<WithdrawResult> {
  if (amount <= 0) {
    return { success: false, amount, toAddress, error: "Amount must be > 0" };
  }

  const balance = await prisma.balance.findUnique({ where: { userId } });
  if (!balance || balance.withdrawable < amount) {
    return {
      success: false,
      amount,
      toAddress,
      error: "Insufficient withdrawable balance",
    };
  }

  await prisma.balance.update({
    where: { userId },
    data: { withdrawable: { decrement: amount } },
  });

  try {
    const { signature, demo } = await withdrawFromHotWallet(toAddress, amount);
    await prisma.user.update({
      where: { id: userId },
      data: { walletAddress: toAddress },
    });
    return { success: true, txSig: signature, amount, toAddress, demo };
  } catch (e) {
    await prisma.balance.update({
      where: { userId },
      data: { withdrawable: { increment: amount } },
    });
    return {
      success: false,
      amount,
      toAddress,
      error: e instanceof Error ? e.message : "Withdraw failed",
    };
  }
}

/** Persist tipper tip amount settings (allowlisted tippers only). */
export async function saveTipSettings(
  userId: string,
  settings: TipAmountSettings
): Promise<TipAmountSettings> {
  const updated = await prisma.tipSettings.upsert({
    where: { userId },
    create: {
      userId,
      likeAmount: Math.max(config.minTipUsd, settings.likeAmount),
      commentAmount: Math.max(config.minTipUsd, settings.commentAmount),
      followAmount: Math.max(config.minTipUsd, settings.followAmount),
      quoteAmount: Math.max(config.minTipUsd, settings.quoteAmount),
      superTipAmount: Math.max(config.minTipUsd, settings.superTipAmount),
      enabled: settings.enabled,
    },
    update: {
      likeAmount: Math.max(config.minTipUsd, settings.likeAmount),
      commentAmount: Math.max(config.minTipUsd, settings.commentAmount),
      followAmount: Math.max(config.minTipUsd, settings.followAmount),
      quoteAmount: Math.max(config.minTipUsd, settings.quoteAmount),
      superTipAmount: Math.max(config.minTipUsd, settings.superTipAmount),
      enabled: settings.enabled,
    },
  });
  return {
    likeAmount: updated.likeAmount,
    commentAmount: updated.commentAmount,
    followAmount: updated.followAmount,
    quoteAmount: updated.quoteAmount,
    superTipAmount: updated.superTipAmount,
    enabled: updated.enabled,
  };
}

/** Credit tipper deposited ledger after observing an on-chain deposit (ops/manual). */
export async function creditDeposit(
  userId: string,
  amount: number
): Promise<number> {
  if (amount <= 0) throw new Error("Deposit amount must be > 0");
  const bal = await prisma.balance.upsert({
    where: { userId },
    create: { userId, deposited: amount },
    update: { deposited: { increment: amount } },
  });
  return bal.deposited;
}
