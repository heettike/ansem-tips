import { config, hasHotWallet } from "@/lib/config";
import { demoTxSig } from "@/lib/demo";
import type { SolanaTransferClient } from "@/types";

/**
 * Solana SPL $ansem transfer helpers.
 * Production path uses @solana/web3.js + spl-token when HOT_WALLET_SECRET is set.
 * Falls back to simulated signatures only when DEMO_MODE=true or secret missing.
 */

function decimalsFactor(): number {
  return 10 ** config.ansemDecimals;
}

export function createSolanaClient(): SolanaTransferClient {
  return {
    async getTokenBalance(owner: string) {
      if (config.demoMode) return 420.69;
      try {
        const { Connection, PublicKey } = await import("@solana/web3.js");
        const { getAssociatedTokenAddress, getAccount } = await import(
          "@solana/spl-token"
        );
        const connection = new Connection(config.solanaRpcUrl, "confirmed");
        const mint = new PublicKey(config.ansemMint);
        const ownerPk = new PublicKey(owner);
        const ata = await getAssociatedTokenAddress(mint, ownerPk);
        const account = await getAccount(connection, ata);
        return Number(account.amount) / decimalsFactor();
      } catch (e) {
        console.error("[solana] getTokenBalance", e);
        return 0;
      }
    },

    async transferAnsem({ fromSecretOrKey, toAddress, amount }) {
      if (config.demoMode || !fromSecretOrKey || fromSecretOrKey === "demo") {
        return { signature: demoTxSig("spl"), demo: true };
      }

      const { Connection, Keypair, PublicKey, Transaction } = await import(
        "@solana/web3.js"
      );
      const {
        getAssociatedTokenAddress,
        createTransferInstruction,
        getAccount,
        createAssociatedTokenAccountInstruction,
        getAssociatedTokenAddressSync,
      } = await import("@solana/spl-token");
      const bs58 = (await import("bs58")).default;

      const connection = new Connection(config.solanaRpcUrl, "confirmed");
      const secret = bs58.decode(fromSecretOrKey);
      const payer = Keypair.fromSecretKey(secret);
      const mint = new PublicKey(config.ansemMint);
      const to = new PublicKey(toAddress);

      const fromAta = await getAssociatedTokenAddress(mint, payer.publicKey);
      const toAta = getAssociatedTokenAddressSync(mint, to);

      const tx = new Transaction();
      try {
        await getAccount(connection, toAta);
      } catch {
        tx.add(
          createAssociatedTokenAccountInstruction(
            payer.publicKey,
            toAta,
            to,
            mint
          )
        );
      }

      const rawAmount = BigInt(Math.round(amount * decimalsFactor()));
      tx.add(
        createTransferInstruction(fromAta, toAta, payer.publicKey, rawAmount)
      );

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = blockhash;
      tx.feePayer = payer.publicKey;

      const sig = await connection.sendTransaction(tx, [payer]);
      await connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed"
      );
      return { signature: sig, demo: false };
    },
  };
}

/** Withdraw path: SPL $ansem from custody hot wallet → recipient personal address */
export async function withdrawFromHotWallet(
  toAddress: string,
  amount: number
): Promise<{ signature: string; demo: boolean }> {
  const client = createSolanaClient();
  if (!hasHotWallet()) {
    if (config.demoMode || !config.hotWalletSecret) {
      return client.transferAnsem({
        fromSecretOrKey: "demo",
        toAddress,
        amount,
      });
    }
    throw new Error("HOT_WALLET_SECRET not configured");
  }
  return client.transferAnsem({
    fromSecretOrKey: config.hotWalletSecret,
    toAddress,
    amount,
  });
}

/**
 * Optional tip-path on-chain move: custody hot wallet → recipient wallet
 * when the recipient already linked a Solana address. Ledger still authoritative.
 */
export async function tipTransferFromHotWallet(
  toAddress: string,
  amount: number
): Promise<{ signature: string; demo: boolean } | null> {
  if (!hasHotWallet()) return null;
  return withdrawFromHotWallet(toAddress, amount);
}

export function explorerTxUrl(sig: string): string {
  return `https://solscan.io/tx/${sig}`;
}

export function explorerTokenUrl(mint: string): string {
  return `https://solscan.io/token/${mint}`;
}

export function explorerAddressUrl(address: string): string {
  return `https://solscan.io/account/${address}`;
}

export async function resolveHotWalletAddress(): Promise<string | null> {
  if (config.hotWalletAddress) return config.hotWalletAddress;
  if (!config.hotWalletSecret) return null;
  try {
    const { Keypair } = await import("@solana/web3.js");
    const bs58 = (await import("bs58")).default;
    const kp = Keypair.fromSecretKey(bs58.decode(config.hotWalletSecret));
    return kp.publicKey.toBase58();
  } catch {
    return null;
  }
}
