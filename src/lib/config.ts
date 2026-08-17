/**
 * Central config — production paths are the default.
 * DEMO_MODE (or missing subsystem credentials) enables mocks per client.
 * Missing secrets never crash import/build.
 */

function env(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

function envFloat(key: string, fallback: number): number {
  const v = process.env[key];
  if (v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function envBool(key: string, fallback: boolean): boolean {
  const v = process.env[key];
  if (v === undefined || v === "") return fallback;
  return ["1", "true", "yes", "on"].includes(v.toLowerCase());
}

const explicitDemo = envBool("DEMO_MODE", false);

export const config = {
  /** Explicit DEMO_MODE=true. Subsystems also fall back when their own creds are missing. */
  demoMode: explicitDemo,

  // Tipper allowlist (multi-tipper via TIPPER_ALLOWLIST; structured as list for ≤100 tippers)
  tipperAllowlist: env("TIPPER_ALLOWLIST", env("TIPPER_X_USERNAME", "heettike,blknoiz06,srijancse"))
    .split(",")
    .map((s) => s.trim().replace(/^@/, "").toLowerCase())
    .filter(Boolean),

  trialTipper: "heettike",
  prodTipperFuture: "blknoiz06",

  // $ansem
  ansemMint: env(
    "ANSEM_MINT",
    "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump"
  ),
  gratitudeWallet: env(
    "GRATITUDE_WALLET",
    "G4uHQ85j65KBsypPH6qVqoiSYUBuH9YTAqRpuhjLRJBq"
  ),
  ansemDecimals: envFloat("ANSEM_DECIMALS", 6),

  // Solana
  solanaRpcUrl: env("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com"),
  hotWalletSecret: env("HOT_WALLET_SECRET", ""),
  hotWalletAddress: env("HOT_WALLET_ADDRESS", ""),

  // Limits
  minDepositUsd: envFloat("MIN_DEPOSIT_USD", 100),
  minTipUsd: envFloat("MIN_TIP_USD", 1),
  claimExpiryDays: envFloat("CLAIM_EXPIRY_DAYS", 30),
  pollIntervalSeconds: envFloat("POLL_INTERVAL_SECONDS", 55),
  /// Likes settle for one poll cycle; unliked-within-window tips are voided unpaid
  likeSettleSeconds: envFloat("LIKE_SETTLE_SECONDS", 60),

  // Auth
  privyAppId: env("NEXT_PUBLIC_PRIVY_APP_ID", ""),
  privyAppSecret: env("PRIVY_APP_SECRET", ""),

  // Twitter / X
  twitterBearerToken: env("TWITTER_BEARER_TOKEN", ""),
  twitterApiKey: env("TWITTER_API_KEY", ""),
  twitterApiSecret: env("TWITTER_API_SECRET", ""),
  twitterAccessToken: env("TWITTER_ACCESS_TOKEN", ""),
  twitterAccessSecret: env("TWITTER_ACCESS_SECRET", ""),
  twitterBotUserId: env("TWITTER_BOT_USER_ID", ""),

  // Telegram low-balance fallback (X bot TBD)
  telegramBotToken: env("TELEGRAM_BOT_TOKEN", ""),
  telegramChatId: env("TELEGRAM_CHAT_ID", ""),

  // Cron
  cronSecret: env("CRON_SECRET", "dev-cron-secret"),

  // App
  appUrl: env("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
} as const;

export type AppConfig = typeof config;

export function isAllowlistedTipper(username: string): boolean {
  const u = username.replace(/^@/, "").toLowerCase();
  return config.tipperAllowlist.includes(u);
}

/** True when X API bearer is configured for live polling */
export function hasTwitterCreds(): boolean {
  return Boolean(config.twitterBearerToken) && !config.demoMode;
}

/** True when Privy app id + secret are configured */
export function hasPrivyCreds(): boolean {
  return Boolean(config.privyAppId && config.privyAppSecret) && !config.demoMode;
}

/** True when hot wallet secret is present for SPL withdrawals */
export function hasHotWallet(): boolean {
  return Boolean(config.hotWalletSecret) && !config.demoMode;
}
