/**
 * When a recipient logs in with X, merge onto the User we keyed by twitter id.
 * Keep a pre-created Privy DID + Solana wallet so login cannot point tips at a
 * different self-reported address.
 */
export function mergeLoginIdentity(
  existing: {
    privyDid: string | null;
    walletAddress: string | null;
  },
  incoming: {
    privyDid: string;
    walletAddress: string | null;
  }
): { privyDid: string; walletAddress: string | null } {
  return {
    privyDid: existing.privyDid || incoming.privyDid,
    walletAddress: existing.walletAddress || incoming.walletAddress,
  };
}
