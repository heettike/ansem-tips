import { prisma } from "@/lib/db";
import { config, isAllowlistedTipper } from "@/lib/config";
import { createSolanaClient, getSplBalance } from "@/lib/solana";
import { erc20Balance } from "@/lib/evm";
import { chainInfo, isDefaultToken } from "@/lib/chains";
import { creditDeposit } from "@/lib/tips";
import type { DepositWatchResult } from "@/types";

/**
 * Watch tipper Privy Solana wallets for SPL $ansem (Token-2022) arrivals.
 * Credits Balance.deposited for positive deltas since lastSeenTokenBalance.
 *
 * First observation (null lastSeen): baseline only — no credit (auth/sync also
 * baselines on login so only post-login deposits are credited).
 */
export async function watchTipperDeposits(
  usernames?: string[]
): Promise<{ checked: number; creditedTotal: number; results: DepositWatchResult[] }> {
  const tippers = usernames?.length
    ? usernames.map((u) => u.replace(/^@/, "").toLowerCase())
    : config.tipperAllowlist;

  const users = await prisma.user.findMany({
    where: {
      role: "tipper",
      walletAddress: { not: null },
      ...(usernames?.length
        ? { username: { in: tippers } }
        : {
            OR: [
              { username: { in: tippers } },
              { accessStatus: "approved" },
            ],
          }),
    },
    include: { balance: true, tipSettings: true },
  });

  const solana = createSolanaClient();
  const results: DepositWatchResult[] = [];
  let creditedTotal = 0;

  for (const user of users) {
    const hasAccess =
      isAllowlistedTipper(user.username) || user.accessStatus === "approved";
    if (!user.walletAddress || !hasAccess) continue;

    let onchain = 0;
    try {
      onchain = await solana.getTokenBalance(user.walletAddress);
    } catch (e) {
      console.error(`[deposits] balance read failed @${user.username}`, e);
      results.push({
        username: user.username,
        walletAddress: user.walletAddress,
        onchain: 0,
        previous: user.lastSeenTokenBalance,
        credited: 0,
        deposited: user.balance?.deposited ?? null,
      });
      continue;
    }

    const previous = user.lastSeenTokenBalance;
    let credited = 0;

    if (previous == null) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastSeenTokenBalance: onchain },
      });
      results.push({
        username: user.username,
        walletAddress: user.walletAddress,
        onchain,
        previous: null,
        credited: 0,
        deposited: user.balance?.deposited ?? null,
      });
      continue;
    }

    const delta = onchain - previous;
    if (delta > 0) {
      const deposited = await creditDeposit(user.id, delta);
      credited = delta;
      creditedTotal += delta;
      await prisma.user.update({
        where: { id: user.id },
        data: { lastSeenTokenBalance: onchain },
      });
      results.push({
        username: user.username,
        walletAddress: user.walletAddress,
        onchain,
        previous,
        credited,
        deposited,
      });
      console.info(
        `[deposits] credited ${delta} $ansem to @${user.username} (onchain ${previous} → ${onchain})`
      );
    } else if (delta < 0) {
      // Tipper spent/moved tokens out of Privy wallet — snap baseline down, no debit of ledger.
      await prisma.user.update({
        where: { id: user.id },
        data: { lastSeenTokenBalance: onchain },
      });
      results.push({
        username: user.username,
        walletAddress: user.walletAddress,
        onchain,
        previous,
        credited: 0,
        deposited: user.balance?.deposited ?? null,
      });
    } else {
      results.push({
        username: user.username,
        walletAddress: user.walletAddress,
        onchain,
        previous,
        credited: 0,
        deposited: user.balance?.deposited ?? null,
      });
    }
  }

  // Non-default tip tokens: watch the same delta pattern on the per-token ledger.
  for (const user of users) {
    const ts = user.tipSettings;
    if (!ts || isDefaultToken(ts.tipChain, ts.tipTokenAddress)) continue;
    try {
      await watchTokenDeposit(user.id, user.username, {
        chain: ts.tipChain,
        tokenAddress: ts.tipTokenAddress,
        symbol: ts.tipTokenSymbol,
        decimals: ts.tipTokenDecimals,
        solanaOwner: user.walletAddress,
        evmOwner: user.evmAddress,
      });
    } catch (e) {
      console.error(`[deposits] token watch failed @${user.username}`, e);
    }
  }

  return { checked: results.length, creditedTotal, results };
}

async function watchTokenDeposit(
  userId: string,
  username: string,
  t: {
    chain: string;
    tokenAddress: string;
    symbol: string;
    decimals: number;
    solanaOwner: string | null;
    evmOwner: string | null;
  }
): Promise<void> {
  const info = chainInfo(t.chain);
  if (!info || !t.tokenAddress) return;
  const owner = info.kind === "evm" ? t.evmOwner : t.solanaOwner;
  if (!owner) return;

  const onchain =
    info.kind === "evm"
      ? await erc20Balance(t.chain, t.tokenAddress, owner, t.decimals)
      : await getSplBalance(owner, t.tokenAddress, t.decimals);

  const where = {
    userId_chain_tokenAddress: {
      userId,
      chain: t.chain,
      tokenAddress: t.tokenAddress,
    },
  };
  const row = await prisma.tokenBalance.findUnique({ where });

  if (!row || row.lastSeenOnchain == null) {
    // First observation: baseline only, credit nothing.
    await prisma.tokenBalance.upsert({
      where,
      create: {
        userId,
        chain: t.chain,
        tokenAddress: t.tokenAddress,
        symbol: t.symbol,
        decimals: t.decimals,
        lastSeenOnchain: onchain,
      },
      update: { lastSeenOnchain: onchain },
    });
    return;
  }

  const delta = onchain - row.lastSeenOnchain;
  if (delta > 0) {
    await prisma.tokenBalance.update({
      where,
      data: {
        deposited: { increment: delta },
        lastSeenOnchain: onchain,
      },
    });
    console.info(
      `[deposits] credited ${delta} ${t.symbol} (${t.chain}) to @${username}`
    );
  } else if (delta < 0) {
    await prisma.tokenBalance.update({
      where,
      data: { lastSeenOnchain: onchain },
    });
  }
}
