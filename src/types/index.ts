export type ActionType = "like" | "comment" | "follow" | "quote" | "super_tip";
export type TipStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "voided"
  | "skipped_retro";
export type UserRole = "tipper" | "recipient";

export interface TwitterAction {
  actionId: string;
  actionType: Exclude<ActionType, "super_tip"> | "comment" | "quote";
  tipperXId: string;
  tipperUsername: string;
  targetXId?: string;
  targetUsername: string;
  text?: string;
  /** Tweet created_at from X. Omit when missing — poller fails closed and will not pay. */
  createdAt?: string;
  /**
   * Follows from GET /users/:id/following have no timestamp. Poller must never
   * treat a synthetic "now" as a real event time for payment.
   */
  createdAtIsSynthetic?: boolean;
  /** True when 🐂 appears in comment/QT text → upgrade to super_tip */
  hasBullEmoji?: boolean;
}

export interface TipAmountSettings {
  likeAmount: number;
  commentAmount: number;
  followAmount: number;
  quoteAmount: number;
  superTipAmount: number;
  enabled: boolean;
}

export interface BalanceView {
  deposited: number;
  withdrawable: number;
  lifetimeSent: number;
  lifetimeReceived: number;
  walletAddress?: string | null;
}

export interface ProcessTipResult {
  tipId: string;
  status: TipStatus;
  txSig?: string;
  error?: string;
  onChain?: boolean;
}

export type PaySkipReason =
  | "unarmed"
  | "no_wallet"
  | "before_arm"
  | "no_created_at"
  | "follow_baseline";

export type PayDecision = { pay: false; reason: PaySkipReason } | { pay: true };

export interface WithdrawResult {
  success: boolean;
  txSig?: string;
  amount: number;
  toAddress: string;
  error?: string;
  demo?: boolean;
}

export interface TwitterClient {
  getUserByUsername(username: string): Promise<{ id: string; username: string } | null>;
  listRecentLikes(userId: string, sinceId?: string): Promise<TwitterAction[]>;
  listRecentReplies(userId: string, sinceId?: string): Promise<TwitterAction[]>;
  listRecentQuotes(userId: string, sinceId?: string): Promise<TwitterAction[]>;
  listRecentFollows(userId: string): Promise<TwitterAction[]>;
  /** Stub / live DM when tipper balance is low */
  pingLowBalance(username: string, balance: number): Promise<void>;
}

export interface TwitterOAuthTokens {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
}

export interface PrivyClientLike {
  verifyAuthToken(token: string): Promise<{ userId: string; walletAddress?: string } | null>;
  getSolanaWallet(privyDid: string): Promise<string | null>;
  getUserTwitter?(
    privyDid: string
  ): Promise<{ username: string; subject: string } | null>;
  /**
   * Best-effort: Privy server-auth does NOT return provider OAuth tokens today.
   * Tokens must come from client useOAuthTokens → /api/auth/sync.
   */
  getUserTwitterOAuthTokens?(
    privyDid: string
  ): Promise<TwitterOAuthTokens | null>;
}

export interface SolanaTransferClient {
  getTokenBalance(owner: string): Promise<number>;
  transferAnsem(params: {
    fromSecretOrKey: string;
    toAddress: string;
    amount: number;
  }): Promise<{ signature: string; demo: boolean }>;
}

export interface DepositWatchResult {
  username: string;
  walletAddress: string;
  onchain: number;
  previous: number | null;
  credited: number;
  deposited: number | null;
}
