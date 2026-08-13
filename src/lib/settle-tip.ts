import { looksLikeSolanaSignature } from "./clawback";
import type {
  RecipientIdentity,
  ProvisionedRecipient,
} from "./provision-recipient";
import type { ProcessTipResult, TipStatus } from "../types";

export type SettleTipInput = {
  id: string;
  amount: number;
  toXId: string | null;
  toXUsername: string;
  toUser: {
    id: string;
    xId: string;
    username: string;
    privyDid: string | null;
    walletAddress: string | null;
  } | null;
  fromDeposited: number;
};

export type SettleTipDeps = {
  provision: (identity: RecipientIdentity) => Promise<ProvisionedRecipient>;
  transfer: (
    toAddress: string,
    amount: number
  ) => Promise<{ signature: string; demo: boolean }>;
};

export type SettleTipResult = ProcessTipResult & {
  depositedDec: number;
  withdrawableInc: number;
  lifetimeSentInc: number;
  lifetimeReceivedInc: number;
  transferTo: string | null;
  privyDid: string | null;
  walletAddress: string | null;
  privyCreated: boolean;
};

function ledgerFallback(
  tipId: string,
  amount: number,
  extra: Partial<SettleTipResult> = {}
): SettleTipResult {
  return {
    tipId,
    status: "completed" as TipStatus,
    error: extra.error,
    txSig: `ledger_${tipId}`,
    onChain: false,
    depositedDec: amount,
    withdrawableInc: amount,
    lifetimeSentInc: amount,
    lifetimeReceivedInc: amount,
    transferTo: null,
    privyDid: extra.privyDid ?? null,
    walletAddress: extra.walletAddress ?? null,
    privyCreated: extra.privyCreated ?? false,
  };
}

function isRealOnChainSig(signature: string, demo: boolean): boolean {
  if (demo) return false;
  return looksLikeSolanaSignature(signature);
}

/**
 * Credit a tip: provision Privy Solana wallet, SPL from hot wallet to that
 * address only. Fail closed to withdrawable if provision or transfer fails.
 * Never marks on-chain complete without a real signature. Never demo/fake sigs.
 */
export async function settlePendingTip(
  tip: SettleTipInput,
  deps: SettleTipDeps
): Promise<SettleTipResult> {
  if (tip.fromDeposited < tip.amount) {
    return {
      tipId: tip.id,
      status: "failed",
      error: "Insufficient tipper balance",
      depositedDec: 0,
      withdrawableInc: 0,
      lifetimeSentInc: 0,
      lifetimeReceivedInc: 0,
      transferTo: null,
      privyDid: tip.toUser?.privyDid ?? null,
      walletAddress: null,
      privyCreated: false,
    };
  }

  const xId = tip.toUser?.xId || tip.toXId;
  const username = tip.toUser?.username || tip.toXUsername;
  if (!tip.toUser || !xId) {
    return ledgerFallback(tip.id, tip.amount);
  }

  let provisioned: ProvisionedRecipient | null = null;
  try {
    provisioned = await deps.provision({
      xId,
      username,
      existingPrivyDid: tip.toUser.privyDid,
      existingWalletAddress: tip.toUser.walletAddress,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "privy provision failed";
    console.error("[tips] privy provision failed", msg.slice(0, 180));
    return ledgerFallback(tip.id, tip.amount);
  }

  try {
    const result = await deps.transfer(provisioned.walletAddress, tip.amount);
    if (!isRealOnChainSig(result.signature, result.demo)) {
      return ledgerFallback(tip.id, tip.amount, {
        privyDid: provisioned.privyDid,
        walletAddress: provisioned.walletAddress,
        privyCreated: provisioned.created,
        error: "Refusing demo/fake tip signature",
      });
    }
    return {
      tipId: tip.id,
      status: "completed",
      txSig: result.signature,
      onChain: true,
      depositedDec: tip.amount,
      withdrawableInc: 0,
      lifetimeSentInc: tip.amount,
      lifetimeReceivedInc: tip.amount,
      transferTo: provisioned.walletAddress,
      privyDid: provisioned.privyDid,
      walletAddress: provisioned.walletAddress,
      privyCreated: provisioned.created,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "spl transfer failed";
    console.error(
      "[tips] on-chain tip transfer failed; keeping withdrawable",
      msg.slice(0, 180)
    );
    return ledgerFallback(tip.id, tip.amount, {
      privyDid: provisioned.privyDid,
      walletAddress: provisioned.walletAddress,
      privyCreated: provisioned.created,
    });
  }
}
