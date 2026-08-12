import type { TwitterAction, TipAmountSettings, BalanceView } from "@/types";

export const DEMO_TIPPER = {
  xId: "demo-tipper-heettike",
  username: "heettike",
  privyDid: "did:privy:demo-heettike",
  walletAddress: "DemoTipper1111111111111111111111111111111",
};

export const DEMO_SETTINGS: TipAmountSettings = {
  likeAmount: 1,
  commentAmount: 2,
  followAmount: 3,
  quoteAmount: 2,
  superTipAmount: 10,
  enabled: true,
};

/** Demo balances stay empty — never invent fake tip totals. */
export const DEMO_TIPPER_BALANCE: BalanceView = {
  deposited: 0,
  withdrawable: 0,
  lifetimeSent: 0,
  lifetimeReceived: 0,
  walletAddress: DEMO_TIPPER.walletAddress,
};

export const DEMO_RECIPIENT_BALANCE: BalanceView = {
  deposited: 0,
  withdrawable: 0,
  lifetimeSent: 0,
  lifetimeReceived: 0,
  walletAddress: null,
};

export const DEMO_RECENT_TIPS: Array<{
  id: string;
  actionType: "like" | "super_tip" | "follow" | "comment" | "quote";
  actionId: string;
  toXUsername: string;
  amount: number;
  status: "completed" | "pending" | "failed";
  txSig: string;
  createdAt: string;
}> = [];

export function demoTwitterActions(): TwitterAction[] {
  const now = new Date().toISOString();
  return [
    {
      actionId: `like_demo_${Date.now()}`,
      actionType: "like",
      tipperXId: DEMO_TIPPER.xId,
      tipperUsername: DEMO_TIPPER.username,
      targetUsername: "solana",
      targetXId: "x_solana",
      createdAt: now,
    },
    {
      actionId: `comment_demo_${Date.now() + 1}`,
      actionType: "comment",
      tipperXId: DEMO_TIPPER.xId,
      tipperUsername: DEMO_TIPPER.username,
      targetUsername: "a1lon9",
      targetXId: "x_a1lon9",
      text: "bullish 🐂 noice",
      hasBullEmoji: true,
      createdAt: now,
    },
    {
      actionId: `quote_demo_${Date.now() + 2}`,
      actionType: "quote",
      tipperXId: DEMO_TIPPER.xId,
      tipperUsername: DEMO_TIPPER.username,
      targetUsername: "pumpdotfun",
      text: "sending it",
      hasBullEmoji: false,
      createdAt: now,
    },
    {
      actionId: `follow_demo_${Date.now() + 3}`,
      actionType: "follow",
      tipperXId: DEMO_TIPPER.xId,
      tipperUsername: DEMO_TIPPER.username,
      targetUsername: "heliuslabs",
      createdAt: now,
    },
  ];
}

export function demoTxSig(prefix = "demo"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}

/** Landing page placeholder stats — empty until live. */
export const DEMO_LANDING_STATS = {
  tipsSent: 0,
  ansemTipped: 0,
  recipients: 0,
  avgTip: 0,
};
