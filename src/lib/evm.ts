import { chainInfo } from "@/lib/chains";
import { config } from "@/lib/config";

/**
 * EVM ERC-20 rails (base, bsc, robinhood chain) via viem.
 * Payouts come from the EVM custody hot wallet (EVM_HOT_WALLET_PK).
 * Same fail-closed rules as solana: never invent a signature.
 */

const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

function evmHotWalletPk(): string {
  return process.env.EVM_HOT_WALLET_PK || "";
}

export function hasEvmHotWallet(): boolean {
  return Boolean(evmHotWalletPk()) && !config.demoMode;
}

async function clientsFor(chain: string) {
  const info = chainInfo(chain);
  if (!info || info.kind !== "evm") {
    throw new Error(`Not an EVM chain: ${chain}`);
  }
  if (!info.rpcUrl) {
    throw new Error(`No RPC configured for ${chain} (set ${chain.toUpperCase()}_RPC_URL)`);
  }
  const { createPublicClient, createWalletClient, http, defineChain } =
    await import("viem");
  const { privateKeyToAccount } = await import("viem/accounts");

  const viemChain = defineChain({
    id: info.evmChainId,
    name: info.label,
    nativeCurrency: { name: "eth", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [info.rpcUrl] } },
  });

  const publicClient = createPublicClient({
    chain: viemChain,
    transport: http(info.rpcUrl),
  });

  const pk = evmHotWalletPk();
  const account = pk
    ? privateKeyToAccount((pk.startsWith("0x") ? pk : `0x${pk}`) as `0x${string}`)
    : null;
  const walletClient = account
    ? createWalletClient({
        account,
        chain: viemChain,
        transport: http(info.rpcUrl),
      })
    : null;

  return { publicClient, walletClient, account };
}

export async function erc20Balance(
  chain: string,
  tokenAddress: string,
  owner: string,
  decimals: number
): Promise<number> {
  const { publicClient } = await clientsFor(chain);
  const raw = (await publicClient.readContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [owner as `0x${string}`],
  })) as bigint;
  return Number(raw) / 10 ** decimals;
}

export async function transferErc20FromHotWallet(opts: {
  chain: string;
  tokenAddress: string;
  toAddress: string;
  amount: number;
  decimals: number;
}): Promise<{ signature: string; demo: boolean }> {
  if (config.demoMode) {
    throw new Error("Refusing demo/fake EVM transfer");
  }
  const { publicClient, walletClient } = await clientsFor(opts.chain);
  if (!walletClient) {
    throw new Error("EVM_HOT_WALLET_PK not configured — real ERC-20 transfer required");
  }
  const raw = BigInt(Math.round(opts.amount * 10 ** opts.decimals));
  const hash = await walletClient.writeContract({
    address: opts.tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [opts.toAddress as `0x${string}`, raw],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error(`ERC-20 transfer reverted: ${hash}`);
  }
  return { signature: hash, demo: false };
}
