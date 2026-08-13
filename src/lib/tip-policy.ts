import type { PayDecision } from "../types";

/**
 * Never tip for the past.
 * Follows from X's following list have no created_at — never treat "now" as event time.
 * Likes/replies/quotes without a real tweet created_at fail closed (do not pay).
 */
export function actionHasRealCreatedAt(action: {
  actionType: string;
  createdAt?: string | null;
  createdAtIsSynthetic?: boolean;
}): boolean {
  if (action.actionType === "follow") return false;
  if (action.createdAtIsSynthetic) return false;
  if (!action.createdAt) return false;
  const t = Date.parse(action.createdAt);
  return Number.isFinite(t);
}

/** X ISO created_at only. Missing/invalid → undefined (fail closed). Never invent now(). */
export function realCreatedAt(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? iso : undefined;
}

export function decideWhetherToPay(input: {
  actionType: string;
  createdAt?: string | null;
  createdAtIsSynthetic?: boolean;
  tipsArmedAt: Date | null | undefined;
  walletAddress: string | null | undefined;
  followBaselineAt: Date | null | undefined;
}): PayDecision {
  if (!input.walletAddress) return { pay: false, reason: "no_wallet" };
  if (!input.tipsArmedAt) return { pay: false, reason: "unarmed" };

  if (input.actionType === "follow") {
    if (!input.followBaselineAt) return { pay: false, reason: "follow_baseline" };
    // New unprocessed follow after the baseline pass. Do not use createdAt === now().
    return { pay: true };
  }

  if (!actionHasRealCreatedAt(input)) {
    return { pay: false, reason: "no_created_at" };
  }
  const created = new Date(input.createdAt as string);
  if (created < input.tipsArmedAt) {
    return { pay: false, reason: "before_arm" };
  }
  return { pay: true };
}
