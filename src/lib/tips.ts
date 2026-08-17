import { prisma } from "@/lib/db";
import { config, hasPrivyCreds } from "@/lib/config";
import {
  createTwitterClient,
  refreshTwitterUserToken,
} from "@/lib/twitter";
import { withdrawFromHotWallet } from "@/lib/solana";
import { sendTelegramAlert } from "@/lib/telegram";
import { transferSplFromHotWallet } from "@/lib/solana";
import { transferErc20FromHotWallet } from "@/lib/evm";
import { chainInfo, isDefaultToken } from "@/lib/chains";
import {
  debitTokenWithdrawal,
  getTokenBalance,
  settleTokenTipLedger,
  type TokenKey,
} from "@/lib/token-ledger";
import {
  createPrivyAdmin,
  ensureRecipientPrivyWallet,
  type RecipientIdentity,
} from "@/lib/provision-recipient";
import { settlePendingTip } from "@/lib/settle-tip";
import {
  enqueueFetchedActions,
  type EnqueueStore,
} from "@/lib/enqueue-actions";
import { floor0, planClawback, type ClawbackTip } from "@/lib/clawback";
import type {
  ProcessTipResult,
  TipAmountSettings,
  WithdrawResult,
} from "@/types";

const LOW_BALANCE_THRESHOLD = 10; // $ansem units

function prismaEnqueueStore(): EnqueueStore {
  return {
    async hasProcessed(actionId) {
      const existing = await prisma.processedAction.findUnique({
        where: { actionId },
      });
      return Boolean(existing);
    },
    async markProcessed(row) {
      try {
        await prisma.processedAction.create({ data: row });
        return "created";
      } catch {
        return "duplicate";
      }
    },
    async upsertRecipient(row) {
      return prisma.user.upsert({
        where: { xId: row.xId },
        create: {
          xId: row.xId,
          username: row.username,
          role: "recipient",
          balance: { create: {} },
        },
        update: { username: row.username },
        select: { id: true },
      });
    },
    async createTip(row) {
      await prisma.tip.create({
        data: {
          actionType: row.actionType,
          actionId: row.actionId,
          fromUserId: row.fromUserId,
          toUserId: row.toUserId,
          toXUsername: row.toXUsername,
          toXId: row.toXId,
          amount: row.amount,
          chain: row.chain ?? "solana",
          tokenAddress: row.tokenAddress ?? "",
          tokenSymbol: row.tokenSymbol ?? "ansem",
          status: "pending",
          metadata: row.metadata,
        },
      });
    },
    async setFollowBaselineAt(userId, at) {
      await prisma.user.updateMany({
        where: { id: userId, followBaselineAt: null },
        data: { followBaselineAt: at },
      });
    },
  };
}

/**
 * Stamp tipsArmedAt once for a tipper who already completed login + Privy wallet
 * (field added after those users existed). Never overwrites an existing stamp.
 */
export async function armTipperIfReady(userId: string): Promise<Date | null> {
  const now = new Date();
  const updated = await prisma.user.updateMany({
    where: {
      id: userId,
      tipsArmedAt: null,
      walletAddress: { not: null },
      privyDid: { not: null },
    },
    data: { tipsArmedAt: now },
  });
  if (updated.count > 0) return now;
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { tipsArmedAt: true },
  });
  return row?.tipsArmedAt ?? null;
}

/**
 * Reverse ledger-only first-poll follow dumps. Idempotent.
 * Does not touch on-chain signatures.
 */
export async function clawbackRetroTips(): Promise<{
  reversed: number;
  reversedAmount: number;
  voidedPending: number;
  reportedOnchain: Array<{ id: string; txSig: string | null; amount: number }>;
}> {
  const tips = await prisma.tip.findMany({
    where: {
      status: { in: ["completed", "pending", "processing"] },
    },
    select: {
      id: true,
      fromUserId: true,
      toUserId: true,
      actionType: true,
      status: true,
      txSig: true,
      createdAt: true,
      amount: true,
    },
  });

  const tipperIds = [...new Set(tips.map((t) => t.fromUserId))];
  const tippers = await prisma.user.findMany({
    where: { id: { in: tipperIds } },
    select: { id: true, tipsArmedAt: true },
  });
  const armedAtByTipper = new Map(
    tippers.map((u) => [u.id, u.tipsArmedAt] as const)
  );

  const plan = planClawback(tips as ClawbackTip[], armedAtByTipper);

  let reversed = 0;
  let reversedAmount = 0;
  for (const tip of plan.voidLedger) {
    const did = await reverseLedgerTip(tip.id);
    if (did) {
      reversed++;
      reversedAmount += tip.amount;
    }
  }

  let voidedPending = 0;
  if (plan.voidPending.length > 0) {
    const result = await prisma.tip.updateMany({
      where: {
        id: { in: plan.voidPending.map((t) => t.id) },
        status: { in: ["pending", "processing"] },
      },
      data: { status: "skipped_retro" },
    });
    voidedPending = result.count;
  }

  return {
    reversed,
    reversedAmount,
    voidedPending,
    reportedOnchain: plan.reportOnchain.map((t) => ({
      id: t.id,
      txSig: t.txSig,
      amount: t.amount,
    })),
  };
}

async function reverseLedgerTip(tipId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const tip = await tx.tip.findUnique({
      where: { id: tipId },
      include: {
        fromUser: { include: { balance: true } },
        toUser: { include: { balance: true } },
      },
    });
    if (!tip || tip.status !== "completed") return false;
    if (!tip.txSig?.startsWith("ledger_")) return false;

    const fromBal = tip.fromUser.balance;
    if (fromBal) {
      await tx.balance.update({
        where: { userId: tip.fromUserId },
        data: {
          deposited: fromBal.deposited + tip.amount,
          lifetimeSent: floor0(fromBal.lifetimeSent - tip.amount),
        },
      });
    }

    if (tip.toUserId && tip.toUser?.balance) {
      const toBal = tip.toUser.balance;
      await tx.balance.update({
        where: { userId: tip.toUserId },
        data: {
          withdrawable: floor0(toBal.withdrawable - tip.amount),
          lifetimeReceived: floor0(toBal.lifetimeReceived - tip.amount),
        },
      });
    }

    await tx.tip.update({
      where: { id: tipId },
      data: { status: "voided" },
    });
    return true;
  });
}

/**
 * Poll tipper actions from X, enqueue tips, never double-process action_ids.
 */
export async function pollAndEnqueueTips(tipperUsername?: string): Promise<{
  polled: number;
  enqueued: number;
  skipped: number;
  actions: string[];
  authMode: "user" | "bearer" | "demo";
  tokenRefreshed?: boolean;
}> {
  const username = (
    tipperUsername ||
    config.tipperAllowlist[0] ||
    "heettike"
  ).replace(/^@/, "");

  // Load tipper row early so we can use stored Privy-captured X user tokens.
  const existingTipper = await prisma.user.findFirst({
    where: { username: username.toLowerCase() },
  });

  let authMode: "user" | "bearer" | "demo" = "demo";
  let userAccess: string | null = existingTipper?.twitterAccessToken ?? null;
  let tokenRefreshed = false;

  if (userAccess) {
    authMode = "user";
    const expiresAt = existingTipper?.twitterTokenExpiresAt;
    const needsRefresh =
      Boolean(existingTipper?.twitterRefreshToken) &&
      (!expiresAt || expiresAt.getTime() < Date.now() + 60_000);
    if (needsRefresh && existingTipper?.twitterRefreshToken) {
      const refreshed = await refreshTwitterUserToken(
        existingTipper.twitterRefreshToken
      );
      if (refreshed?.accessToken) {
        userAccess = refreshed.accessToken;
        tokenRefreshed = true;
        await prisma.user.update({
          where: { id: existingTipper.id },
          data: {
            twitterAccessToken: refreshed.accessToken,
            twitterRefreshToken:
              refreshed.refreshToken ?? existingTipper.twitterRefreshToken,
            twitterTokenExpiresAt: refreshed.expiresAt ?? null,
          },
        });
      }
    }
  } else if (config.twitterBearerToken && !config.demoMode) {
    authMode = "bearer";
  }

  const twitter = createTwitterClient(userAccess);
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
          deposited: 0,
        },
      },
    },
    update: { username: tipperUser.username },
    include: { tipSettings: true, balance: true },
  });

  const armedAt = await armTipperIfReady(tipper.id);
  const tipperArmed = await prisma.user.findUnique({
    where: { id: tipper.id },
    select: { tipsArmedAt: true, followBaselineAt: true, walletAddress: true },
  });

  if (!tipper.tipSettings?.enabled) {
    return { polled: 0, enqueued: 0, skipped: 0, actions: [], authMode, tokenRefreshed };
  }
  const tipSettings = tipper.tipSettings;

  async function safeList<T>(label: string, fn: () => Promise<T[]>, fallback: T[] = []): Promise<T[]> {
    try {
      return await fn();
    } catch (e) {
      // liked_tweets / following often need user context; fall back to app bearer for search endpoints.
      console.warn(`[tips] ${label} failed (${authMode}):`, e instanceof Error ? e.message : e);
      if (authMode === "user" && config.twitterBearerToken && !config.demoMode) {
        try {
          const appClient = createTwitterClient(null);
          if (label === "likes") return (await appClient.listRecentLikes(tipperUser!.id)) as T[];
          if (label === "follows") return (await appClient.listRecentFollows(tipperUser!.id)) as T[];
          if (label === "replies") return (await appClient.listRecentReplies(tipperUser!.id)) as T[];
          if (label === "quotes") return (await appClient.listRecentQuotes(tipperUser!.id)) as T[];
        } catch (e2) {
          console.warn(`[tips] ${label} bearer fallback failed`, e2 instanceof Error ? e2.message : e2);
        }
      }
      return fallback;
    }
  }

  const [likes, replies, quotes, follows] = await Promise.all([
    safeList("likes", () => twitter.listRecentLikes(tipperUser.id)),
    safeList("replies", () => twitter.listRecentReplies(tipperUser.id)),
    safeList("quotes", () => twitter.listRecentQuotes(tipperUser.id)),
    safeList("follows", () => twitter.listRecentFollows(tipperUser.id)),
  ]);

  const all = [...likes, ...replies, ...quotes, ...follows].map((a) => ({
    ...a,
    tipperUsername: tipperUser.username,
    tipperXId: tipperUser.id,
  }));

  const { enqueued, skipped, actions } = await enqueueFetchedActions({
    tipper: {
      id: tipper.id,
      xId: tipperUser.id,
      walletAddress: tipperArmed?.walletAddress ?? tipper.walletAddress,
      tipsArmedAt: armedAt ?? tipperArmed?.tipsArmedAt ?? null,
      followBaselineAt: tipperArmed?.followBaselineAt ?? null,
      tipSettings,
    },
    actions: all,
    store: prismaEnqueueStore(),
  });

  const bal = tipper.balance?.deposited ?? 0;
  if (bal < LOW_BALANCE_THRESHOLD) {
    await twitter.pingLowBalance(tipperUser.username, bal);
    await sendTelegramAlert(
      `low balance: @${tipperUser.username} has ${bal.toFixed(2)} $ansem left to tip`
    );
    console.warn(
      `[ALERT] Low tipper balance for @${tipperUser.username}: ${bal}`
    );
  }

  return { polled: all.length, enqueued, skipped, actions, authMode, tokenRefreshed };
}

async function provisionRecipientWallet(identity: RecipientIdentity) {
  if (!hasPrivyCreds()) {
    throw new Error("Privy not configured");
  }
  return ensureRecipientPrivyWallet(
    identity,
    createPrivyAdmin({
      appId: config.privyAppId,
      appSecret: config.privyAppSecret,
    })
  );
}

/**
 * Process a pending tip: provision a Privy Solana wallet for the recipient,
 * SPL from hot wallet to that address, debit tipper deposited.
 * Fail closed to withdrawable if Privy create or SPL fails.
 */
export async function processTip(tipId: string): Promise<ProcessTipResult> {
  const tip = await prisma.tip.findUnique({
    where: { id: tipId },
    include: {
      fromUser: { include: { balance: true, tipSettings: true } },
      toUser: true,
    },
  });
  if (!tip) return { tipId, status: "failed", error: "Tip not found" };
  if (tip.status === "completed") {
    return { tipId, status: "completed", txSig: tip.txSig ?? undefined };
  }
  if (tip.status === "voided" || tip.status === "skipped_retro") {
    return { tipId, status: tip.status };
  }

  const from = tip.fromUser;
  const skipRetro =
    !from.walletAddress ||
    !from.tipsArmedAt ||
    tip.createdAt < from.tipsArmedAt ||
    (tip.actionType === "follow" &&
      (!from.followBaselineAt || tip.createdAt <= from.followBaselineAt));

  if (skipRetro) {
    await prisma.tip.update({
      where: { id: tipId },
      data: { status: "skipped_retro" },
    });
    return { tipId, status: "skipped_retro", error: "never tip for the past" };
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
    await sendTelegramAlert(
      `tip failed: @${tip.fromUser.username} has ${deposited.toFixed(2)} $ansem, needed ${tip.amount.toFixed(2)}`
    );
    console.warn(
      `[ALERT] Insufficient balance for tip ${tipId}: have ${deposited}, need ${tip.amount}`
    );
    return { tipId, status: "failed", error: "Insufficient tipper balance" };
  }

  // Non-default tokens settle to the per-token ledger; payout happens at withdraw.
  if (!isDefaultToken(tip.chain, tip.tokenAddress)) {
    if (!tip.toUserId) {
      await prisma.tip.update({ where: { id: tipId }, data: { status: "failed" } });
      return { tipId, status: "failed", error: "No recipient for token tip" };
    }
    const key: TokenKey = {
      chain: tip.chain,
      tokenAddress: tip.tokenAddress,
      symbol: tip.tokenSymbol,
      decimals: tip.fromUser.tipSettings?.tipTokenDecimals ?? 18,
    };
    const ok = await settleTokenTipLedger({
      fromUserId: tip.fromUserId,
      toUserId: tip.toUserId,
      key,
      amount: tip.amount,
    });
    if (!ok) {
      await prisma.tip.update({ where: { id: tipId }, data: { status: "failed" } });
      await sendTelegramAlert(
        `tip failed: @${tip.fromUser.username} lacks ${tip.amount} ${tip.tokenSymbol} (${tip.chain})`
      );
      return { tipId, status: "failed", error: "Insufficient token balance" };
    }
    const txSig = `ledger_${tipId}`;
    await prisma.tip.update({
      where: { id: tipId },
      data: { status: "completed", txSig },
    });
    return { tipId, status: "completed", txSig, onChain: false };
  }

  const settled = await settlePendingTip(
    {
      id: tip.id,
      amount: tip.amount,
      toXId: tip.toXId,
      toXUsername: tip.toXUsername,
      fromDeposited: deposited,
      toUser: tip.toUser
        ? {
            id: tip.toUser.id,
            xId: tip.toUser.xId,
            username: tip.toUser.username,
            privyDid: tip.toUser.privyDid,
            walletAddress: tip.toUser.walletAddress,
          }
        : null,
    },
    {
      provision: provisionRecipientWallet,
      transfer: withdrawFromHotWallet,
    }
  );

  await prisma.$transaction(async (tx) => {
    if (settled.depositedDec > 0) {
      await tx.balance.update({
        where: { userId: tip.fromUserId },
        data: {
          deposited: { decrement: settled.depositedDec },
          lifetimeSent: { increment: settled.lifetimeSentInc },
        },
      });
    }

    if (tip.toUserId && settled.lifetimeReceivedInc > 0) {
      await tx.balance.upsert({
        where: { userId: tip.toUserId },
        create: {
          userId: tip.toUserId,
          withdrawable: settled.withdrawableInc,
          lifetimeReceived: settled.lifetimeReceivedInc,
        },
        update: {
          withdrawable: { increment: settled.withdrawableInc },
          lifetimeReceived: { increment: settled.lifetimeReceivedInc },
        },
      });
    }

    if (tip.toUserId && settled.walletAddress) {
      await tx.user.update({
        where: { id: tip.toUserId },
        data: { walletAddress: settled.walletAddress },
      });
    }
    if (tip.toUserId && settled.privyDid && !tip.toUser?.privyDid) {
      try {
        await tx.user.updateMany({
          where: { id: tip.toUserId, privyDid: null },
          data: { privyDid: settled.privyDid },
        });
      } catch {
        // unique privyDid already owned — walletAddress is still stored
      }
    }

    await tx.tip.update({
      where: { id: tipId },
      data: {
        status: settled.status,
        txSig: settled.txSig ?? null,
      },
    });
  });

  return {
    tipId: settled.tipId,
    status: settled.status,
    txSig: settled.txSig,
    onChain: settled.onChain,
    error: settled.error,
  };
}

export async function processPendingTips(limit = 25): Promise<ProcessTipResult[]> {
  await clawbackRetroTips();
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
  amount: number,
  token?: TokenKey
): Promise<WithdrawResult> {
  if (amount <= 0) {
    return { success: false, amount, toAddress, error: "Amount must be > 0" };
  }

  // Non-default tokens: per-token ledger + per-chain custody payout.
  if (token && !isDefaultToken(token.chain, token.tokenAddress)) {
    return withdrawTokenForUser(userId, toAddress, amount, token);
  }

  const balance = await prisma.balance.findUnique({ where: { userId } });
  if (!balance || balance.withdrawable < amount) {
    return {
      success: false,
      amount,
      toAddress,
      error:
        "Nothing to withdraw yet — your tip balance is 0 (or too low for that amount).",
    };
  }

  // Debit only after a real on-chain transfer succeeds.
  try {
    const { signature, demo } = await withdrawFromHotWallet(toAddress, amount);
    if (demo) {
      return {
        success: false,
        amount,
        toAddress,
        error: "Refusing demo/fake withdraw",
        demo: true,
      };
    }
    await prisma.$transaction(async (tx) => {
      await tx.balance.update({
        where: { userId },
        data: { withdrawable: { decrement: amount } },
      });
      await tx.user.updateMany({
        where: { id: userId, walletAddress: null },
        data: { walletAddress: toAddress },
      });
      await tx.user.update({
        where: { id: userId },
        data: { lastActiveAt: new Date() },
      });
      await tx.withdrawal.create({
        data: {
          userId,
          amount,
          toAddress,
          txSig: signature,
          status: "completed",
        },
      });
    });
    return { success: true, txSig: signature, amount, toAddress, demo: false };
  } catch (e) {
    return {
      success: false,
      amount,
      toAddress,
      error: e instanceof Error ? e.message : "Withdraw failed",
    };
  }
}

/** Multi-chain token withdraw: TokenBalance ledger + SPL or ERC-20 custody payout. */
async function withdrawTokenForUser(
  userId: string,
  toAddress: string,
  amount: number,
  token: TokenKey
): Promise<WithdrawResult> {
  const info = chainInfo(token.chain);
  if (!info) {
    return { success: false, amount, toAddress, error: `Unknown chain: ${token.chain}` };
  }
  const bal = await getTokenBalance(userId, token);
  if (!bal || bal.withdrawable < amount) {
    return {
      success: false,
      amount,
      toAddress,
      error: "Nothing to withdraw yet — your tip balance is 0 (or too low for that amount).",
    };
  }

  try {
    const result =
      info.kind === "evm"
        ? await transferErc20FromHotWallet({
            chain: token.chain,
            tokenAddress: token.tokenAddress,
            toAddress,
            amount,
            decimals: token.decimals,
          })
        : await transferSplFromHotWallet({
            mintAddress: token.tokenAddress,
            decimals: token.decimals,
            toAddress,
            amount,
          });

    await prisma.$transaction(async (tx) => {
      await tx.tokenBalance.update({
        where: {
          userId_chain_tokenAddress: {
            userId,
            chain: token.chain,
            tokenAddress: token.tokenAddress,
          },
        },
        data: { withdrawable: { decrement: amount } },
      });
      await tx.user.update({
        where: { id: userId },
        data: { lastActiveAt: new Date() },
      });
      await tx.withdrawal.create({
        data: {
          userId,
          amount,
          chain: token.chain,
          tokenAddress: token.tokenAddress,
          tokenSymbol: token.symbol,
          toAddress,
          txSig: result.signature,
          status: "completed",
        },
      });
    });
    return { success: true, txSig: result.signature, amount, toAddress, demo: false };
  } catch (e) {
    return {
      success: false,
      amount,
      toAddress,
      error: e instanceof Error ? e.message : "Withdraw failed",
    };
  }
}

function tokenSettingsUpdate(settings: TipAmountSettings) {
  if (!settings.tipChain) return {};
  return {
    tipChain: settings.tipChain,
    tipTokenAddress: settings.tipTokenAddress ?? "",
    tipTokenSymbol: settings.tipTokenSymbol || "ansem",
    tipTokenDecimals: settings.tipTokenDecimals ?? 6,
  };
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
      ...(settings.commentTrigger ? { commentTrigger: settings.commentTrigger } : {}),
      ...(settings.superTipTrigger ? { superTipTrigger: settings.superTipTrigger } : {}),
      ...tokenSettingsUpdate(settings),
      enabled: settings.enabled,
    },
    update: {
      likeAmount: Math.max(config.minTipUsd, settings.likeAmount),
      commentAmount: Math.max(config.minTipUsd, settings.commentAmount),
      followAmount: Math.max(config.minTipUsd, settings.followAmount),
      quoteAmount: Math.max(config.minTipUsd, settings.quoteAmount),
      superTipAmount: Math.max(config.minTipUsd, settings.superTipAmount),
      ...(settings.commentTrigger ? { commentTrigger: settings.commentTrigger } : {}),
      ...(settings.superTipTrigger ? { superTipTrigger: settings.superTipTrigger } : {}),
      ...tokenSettingsUpdate(settings),
      enabled: settings.enabled,
    },
  });
  return {
    likeAmount: updated.likeAmount,
    commentAmount: updated.commentAmount,
    followAmount: updated.followAmount,
    quoteAmount: updated.quoteAmount,
    superTipAmount: updated.superTipAmount,
    commentTrigger: updated.commentTrigger,
    superTipTrigger: updated.superTipTrigger,
    tipChain: updated.tipChain,
    tipTokenAddress: updated.tipTokenAddress,
    tipTokenSymbol: updated.tipTokenSymbol,
    tipTokenDecimals: updated.tipTokenDecimals,
    enabled: updated.enabled,
  };
}

/**
 * Expire stale claims: ledger-credited tips older than CLAIM_EXPIRY_DAYS whose
 * recipient hasn't logged in or withdrawn in that window go back to the tipper.
 * On-chain-paid tips (real txSig) are never touched.
 */
export async function expireStaleClaims(): Promise<{
  expired: number;
  refunded: number;
}> {
  const cutoff = new Date(
    Date.now() - config.claimExpiryDays * 24 * 60 * 60 * 1000
  );
  const stale = await prisma.tip.findMany({
    where: {
      status: "completed",
      txSig: { startsWith: "ledger_" },
      createdAt: { lt: cutoff },
      toUserId: { not: null },
    },
    include: { toUser: true },
    take: 200,
    orderBy: { createdAt: "asc" },
  });

  let expired = 0;
  let refunded = 0;

  for (const tip of stale) {
    const lastActive = tip.toUser?.lastActiveAt;
    if (lastActive && lastActive.getTime() >= cutoff.getTime()) continue;

    await prisma.$transaction(async (tx) => {
      const bal = await tx.balance.findUnique({
        where: { userId: tip.toUserId! },
      });
      const refund = Math.min(tip.amount, bal?.withdrawable ?? 0);
      if (refund > 0) {
        await tx.balance.update({
          where: { userId: tip.toUserId! },
          data: { withdrawable: { decrement: refund } },
        });
        await tx.balance.upsert({
          where: { userId: tip.fromUserId },
          create: { userId: tip.fromUserId, deposited: refund },
          update: { deposited: { increment: refund } },
        });
      }
      await tx.tip.update({
        where: { id: tip.id },
        data: { status: "expired" },
      });
      refunded += refund;
    });
    expired++;
  }

  if (expired > 0) {
    console.warn(
      `[tips] expired ${expired} stale claims, refunded ${refunded.toFixed(2)} $ansem to tippers`
    );
  }
  return { expired, refunded };
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
