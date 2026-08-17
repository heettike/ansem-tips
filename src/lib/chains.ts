/**
 * Chain registry. Tips can be denominated in any registered token;
 * default rail is $ansem on solana. EVM rails need per-chain RPC env
 * (defaults below) + EVM_HOT_WALLET_PK for payouts.
 */

export type ChainKind = "svm" | "evm";
export type ChainId = "solana" | "base" | "bsc" | "robinhood";

export type ChainInfo = {
  id: ChainId;
  kind: ChainKind;
  label: string;
  /** EVM numeric chain id (0 for svm) */
  evmChainId: number;
  rpcUrl: string;
  explorerTx: (sig: string) => string;
};

function env(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

export const CHAINS: Record<ChainId, ChainInfo> = {
  solana: {
    id: "solana",
    kind: "svm",
    label: "solana",
    evmChainId: 0,
    rpcUrl: env("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com"),
    explorerTx: (sig) => `https://solscan.io/tx/${sig}`,
  },
  base: {
    id: "base",
    kind: "evm",
    label: "base",
    evmChainId: 8453,
    rpcUrl: env("BASE_RPC_URL", "https://mainnet.base.org"),
    explorerTx: (sig) => `https://basescan.org/tx/${sig}`,
  },
  bsc: {
    id: "bsc",
    kind: "evm",
    label: "bnb chain",
    evmChainId: 56,
    rpcUrl: env("BSC_RPC_URL", "https://bsc-dataseed.binance.org"),
    explorerTx: (sig) => `https://bscscan.com/tx/${sig}`,
  },
  robinhood: {
    id: "robinhood",
    kind: "evm",
    label: "robinhood chain",
    evmChainId: Number(env("ROBINHOOD_CHAIN_ID", "0")),
    rpcUrl: env("ROBINHOOD_RPC_URL", ""),
    explorerTx: (sig) =>
      env("ROBINHOOD_EXPLORER", "https://explorer.robinhood.com") + `/tx/${sig}`,
  },
};

export function chainInfo(id: string): ChainInfo | null {
  return (CHAINS as Record<string, ChainInfo>)[id] ?? null;
}

export function isChainId(id: string): id is ChainId {
  return id in CHAINS;
}

/** Default $ansem rail: chain solana + empty tokenAddress on ledger rows */
export function isDefaultToken(chain: string, tokenAddress: string): boolean {
  return chain === "solana" && !tokenAddress;
}
