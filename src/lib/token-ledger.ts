import { prisma } from "@/lib/db";
import { isDefaultToken } from "@/lib/chains";

/**
 * Per-token ledger ops for non-default tokens.
 * Default $ansem stays on Balance; everything else lives on TokenBalance,
 * keyed by (userId, chain, tokenAddress).
 */

export type TokenKey = {
  chain: string;
  tokenAddress: string;
  symbol: string;
  decimals: number;
};

export { isDefaultToken };

export async function getTokenBalance(userId: string, key: TokenKey) {
  return prisma.tokenBalance.findUnique({
    where: {
      userId_chain_tokenAddress: {
        userId,
        chain: key.chain,
        tokenAddress: key.tokenAddress,
      },
    },
  });
}

export async function creditTokenDeposit(
  userId: string,
  key: TokenKey,
  amount: number
): Promise<number> {
  if (amount <= 0) throw new Error("Deposit amount must be > 0");
  const row = await prisma.tokenBalance.upsert({
    where: {
      userId_chain_tokenAddress: {
        userId,
        chain: key.chain,
        tokenAddress: key.tokenAddress,
      },
    },
    create: {
      userId,
      chain: key.chain,
      tokenAddress: key.tokenAddress,
      symbol: key.symbol,
      decimals: key.decimals,
      deposited: amount,
    },
    update: { deposited: { increment: amount } },
  });
  return row.deposited;
}

/**
 * Ledger-settle a token tip: debit tipper deposited, credit recipient
 * withdrawable. Returns false (no throw) when the tipper lacks balance.
 */
export async function settleTokenTipLedger(opts: {
  fromUserId: string;
  toUserId: string;
  key: TokenKey;
  amount: number;
}): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const from = await tx.tokenBalance.findUnique({
      where: {
        userId_chain_tokenAddress: {
          userId: opts.fromUserId,
          chain: opts.key.chain,
          tokenAddress: opts.key.tokenAddress,
        },
      },
    });
    if (!from || from.deposited < opts.amount) return false;

    await tx.tokenBalance.update({
      where: { id: from.id },
      data: { deposited: { decrement: opts.amount } },
    });
    await tx.tokenBalance.upsert({
      where: {
        userId_chain_tokenAddress: {
          userId: opts.toUserId,
          chain: opts.key.chain,
          tokenAddress: opts.key.tokenAddress,
        },
      },
      create: {
        userId: opts.toUserId,
        chain: opts.key.chain,
        tokenAddress: opts.key.tokenAddress,
        symbol: opts.key.symbol,
        decimals: opts.key.decimals,
        withdrawable: opts.amount,
      },
      update: { withdrawable: { increment: opts.amount } },
    });
    return true;
  });
}

/** Debit withdrawable after a successful on-chain payout. */
export async function debitTokenWithdrawal(
  userId: string,
  key: TokenKey,
  amount: number
): Promise<void> {
  await prisma.tokenBalance.update({
    where: {
      userId_chain_tokenAddress: {
        userId,
        chain: key.chain,
        tokenAddress: key.tokenAddress,
      },
    },
    data: { withdrawable: { decrement: amount } },
  });
}
