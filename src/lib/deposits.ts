import { prisma } from "@/lib/db";
import { config, isAllowlistedTipper } from "@/lib/config";
import { createSolanaClient } from "@/lib/solana";
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
      username: { in: tippers },
      walletAddress: { not: null },
    },
    include: { balance: true },
  });

  const solana = createSolanaClient();
  const results: DepositWatchResult[] = [];
  let creditedTotal = 0;

  for (const user of users) {
    if (!user.walletAddress || !isAllowlistedTipper(user.username)) continue;

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

  return { checked: results.length, creditedTotal, results };
}
