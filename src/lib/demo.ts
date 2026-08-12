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

export const DEMO_TIPPER_BALANCE: BalanceView = {
  deposited: 420.69,
  withdrawable: 0,
  lifetimeSent: 69.42,
  lifetimeReceived: 0,
  walletAddress: DEMO_TIPPER.walletAddress,
};

export const DEMO_RECIPIENT_BALANCE: BalanceView = {
  deposited: 0,
  withdrawable: 12.5,
  lifetimeSent: 0,
  lifetimeReceived: 12.5,
  walletAddress: null,
};

export const DEMO_RECENT_TIPS = [
  {
    id: "tip_demo_1",
    actionType: "like" as const,
    actionId: "like_demo_1001",
    toXUsername: "solana",
    amount: 1,
    status: "completed" as const,
    txSig: "demo_sig_like_1001",
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
  },
  {
    id: "tip_demo_2",
    actionType: "super_tip" as const,
    actionId: "comment_demo_1002",
    toXUsername: "a1lon9",
    amount: 10,
    status: "completed" as const,
    txSig: "demo_sig_super_1002",
    createdAt: new Date(Date.now() - 7200_000).toISOString(),
  },
  {
    id: "tip_demo_3",
    actionType: "follow" as const,
    actionId: "follow_demo_1003",
    toXUsername: "pumpdotfun",
    amount: 3,
    status: "completed" as const,
    txSig: "demo_sig_follow_1003",
    createdAt: new Date(Date.now() - 10800_000).toISOString(),
  },
];

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

/** Landing page placeholder “noice” stats */
export const DEMO_LANDING_STATS = {
  tipsSent: 1337,
  ansemTipped: 42069,
  recipients: 256,
  avgTip: 2.4,
};
