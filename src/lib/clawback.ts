/**
 * Ledger-only clawback of the first-poll follow dump.
 * Never touches tips whose txSig looks like a real Solana signature.
 */

export type ClawbackTip = {
  id: string;
  fromUserId: string;
  toUserId: string | null;
  actionType: string;
  status: string;
  txSig: string | null;
  createdAt: Date;
  amount: number;
};

export type ClawbackAction =
  | "void_ledger"
  | "void_pending"
  | "report_onchain"
  | "skip";

const CLUSTER_MS = 2_000;

export function isLedgerTxSig(txSig: string | null | undefined): boolean {
  return Boolean(txSig && txSig.startsWith("ledger_"));
}

export function looksLikeSolanaSignature(txSig: string | null | undefined): boolean {
  if (!txSig) return false;
  if (txSig.startsWith("ledger_") || txSig.startsWith("demo_")) return false;
  if (txSig.includes("_")) return false;
  // Solana signatures are 64-byte ed25519, typically 87–88 base58 chars.
  return txSig.length >= 64;
}

/** Earliest same-time follow cluster per tipper (first-poll dump). Later clusters are left alone. */
export function earliestFollowDumpIds(
  tips: ClawbackTip[],
  minClusterSize = 2
): Set<string> {
  const byTipper = new Map<string, ClawbackTip[]>();
  for (const t of tips) {
    if (t.actionType !== "follow") continue;
    if (t.status === "voided" || t.status === "skipped_retro") continue;
    const arr = byTipper.get(t.fromUserId) ?? [];
    arr.push(t);
    byTipper.set(t.fromUserId, arr);
  }

  const dumpIds = new Set<string>();
  for (const arr of byTipper.values()) {
    arr.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    if (arr.length === 0) continue;
    const start = arr[0].createdAt.getTime();
    const cluster: ClawbackTip[] = [];
    for (const t of arr) {
      if (t.createdAt.getTime() - start <= CLUSTER_MS) cluster.push(t);
      else break;
    }
    if (cluster.length >= minClusterSize) {
      for (const t of cluster) dumpIds.add(t.id);
    }
  }
  return dumpIds;
}

export function classifyClawbackTip(
  tip: ClawbackTip,
  dumpIds: Set<string>,
  tipsArmedAt: Date | null | undefined
): ClawbackAction {
  if (tip.status === "voided" || tip.status === "skipped_retro") return "skip";

  const inDump = dumpIds.has(tip.id);
  const pendingBeforeArm =
    tip.status === "pending" &&
    Boolean(tipsArmedAt) &&
    tip.createdAt < (tipsArmedAt as Date);

  if (tip.status === "pending") {
    if (inDump || pendingBeforeArm) return "void_pending";
    return "skip";
  }

  if (tip.status !== "completed") return "skip";
  if (!inDump) return "skip";

  if (isLedgerTxSig(tip.txSig)) return "void_ledger";
  if (looksLikeSolanaSignature(tip.txSig)) return "report_onchain";
  return "skip";
}

export type ClawbackPlan = {
  voidLedger: ClawbackTip[];
  voidPending: ClawbackTip[];
  reportOnchain: ClawbackTip[];
};

export function planClawback(
  tips: ClawbackTip[],
  armedAtByTipper: Map<string, Date | null>
): ClawbackPlan {
  const dumpIds = earliestFollowDumpIds(tips);
  const voidLedger: ClawbackTip[] = [];
  const voidPending: ClawbackTip[] = [];
  const reportOnchain: ClawbackTip[] = [];

  for (const tip of tips) {
    const action = classifyClawbackTip(
      tip,
      dumpIds,
      armedAtByTipper.get(tip.fromUserId) ?? null
    );
    if (action === "void_ledger") voidLedger.push(tip);
    else if (action === "void_pending") voidPending.push(tip);
    else if (action === "report_onchain") reportOnchain.push(tip);
  }

  return { voidLedger, voidPending, reportOnchain };
}

export function floor0(n: number): number {
  return n < 0 ? 0 : n;
}
