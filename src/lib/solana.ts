import { config, hasHotWallet } from "@/lib/config";
import { demoTxSig } from "@/lib/demo";
import type { SolanaTransferClient } from "@/types";

/**
 * Solana SPL $ansem transfer helpers.
 * $ansem mint is Token-2022 (TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb).
 * Production path uses @solana/web3.js + @solana/spl-token when HOT_WALLET_SECRET is set.
 * DEMO_MODE only — never invent success when the real path fails.
 */

function decimalsFactor(): number {
  return 10 ** config.ansemDecimals;
}

export function createSolanaClient(): SolanaTransferClient {
  return {
    async getTokenBalance(owner: string) {
      if (config.demoMode) return 0;
      try {
        const { Connection, PublicKey } = await import("@solana/web3.js");
        const {
          getAssociatedTokenAddress,
          getAccount,
          TOKEN_2022_PROGRAM_ID,
        } = await import("@solana/spl-token");
        const connection = new Connection(config.solanaRpcUrl, "confirmed");
        const mint = new PublicKey(config.ansemMint);
        const ownerPk = new PublicKey(owner);
        const ata = await getAssociatedTokenAddress(
          mint,
          ownerPk,
          false,
          TOKEN_2022_PROGRAM_ID
        );
        const account = await getAccount(
          connection,
          ata,
          "confirmed",
          TOKEN_2022_PROGRAM_ID
        );
        return Number(account.amount) / decimalsFactor();
      } catch (e) {
        console.error("[solana] getTokenBalance", e);
        return 0;
      }
    },

    async transferAnsem({ fromSecretOrKey, toAddress, amount }) {
      if (config.demoMode) {
        return { signature: demoTxSig("spl"), demo: true };
      }
      if (!fromSecretOrKey || fromSecretOrKey === "demo") {
        throw new Error("Missing hot wallet secret — refusing fake transfer");
      }

      const { Connection, Keypair, PublicKey, Transaction } = await import(
        "@solana/web3.js"
      );
      const {
        getAssociatedTokenAddress,
        createTransferCheckedInstruction,
        getAccount,
        createAssociatedTokenAccountInstruction,
        getAssociatedTokenAddressSync,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      } = await import("@solana/spl-token");
      const bs58 = (await import("bs58")).default;

      const connection = new Connection(config.solanaRpcUrl, "confirmed");
      const secret = bs58.decode(fromSecretOrKey);
      const payer = Keypair.fromSecretKey(secret);
      const mint = new PublicKey(config.ansemMint);
      const to = new PublicKey(toAddress);
      const decimals = config.ansemDecimals;

      const fromAta = await getAssociatedTokenAddress(
        mint,
        payer.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      const toAta = getAssociatedTokenAddressSync(
        mint,
        to,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const tx = new Transaction();
      try {
        await getAccount(
          connection,
          toAta,
          "confirmed",
          TOKEN_2022_PROGRAM_ID
        );
      } catch {
        tx.add(
          createAssociatedTokenAccountInstruction(
            payer.publicKey,
            toAta,
            to,
            mint,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
      }

      const rawAmount = BigInt(Math.round(amount * decimalsFactor()));
      tx.add(
        createTransferCheckedInstruction(
          fromAta,
          mint,
          toAta,
          payer.publicKey,
          rawAmount,
          decimals,
          [],
          TOKEN_2022_PROGRAM_ID
        )
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
    throw new Error(
      "HOT_WALLET_SECRET not configured — real SPL withdraw required"
    );
  }
  const result = await client.transferAnsem({
    fromSecretOrKey: config.hotWalletSecret,
    toAddress,
    amount,
  });
  if (result.demo) {
    throw new Error("Refusing demo/fake withdraw signature");
  }
  return result;
}

/** Detect the token program owning a mint (Token-2022 vs classic SPL). */
async function tokenProgramForMint(
  connection: import("@solana/web3.js").Connection,
  mint: import("@solana/web3.js").PublicKey
) {
  const { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } = await import(
    "@solana/spl-token"
  );
  const info = await connection.getAccountInfo(mint);
  if (!info) throw new Error(`Mint not found: ${mint.toBase58()}`);
  return info.owner.equals(TOKEN_2022_PROGRAM_ID)
    ? TOKEN_2022_PROGRAM_ID
    : TOKEN_PROGRAM_ID;
}

/** Balance of any SPL token (classic or Token-2022) for an owner. */
export async function getSplBalance(
  owner: string,
  mintAddress: string,
  decimals: number
): Promise<number> {
  if (config.demoMode) return 0;
  try {
    const { Connection, PublicKey } = await import("@solana/web3.js");
    const { getAssociatedTokenAddress, getAccount } = await import(
      "@solana/spl-token"
    );
    const connection = new Connection(config.solanaRpcUrl, "confirmed");
    const mint = new PublicKey(mintAddress);
    const program = await tokenProgramForMint(connection, mint);
    const ata = await getAssociatedTokenAddress(
      mint,
      new PublicKey(owner),
      false,
      program
    );
    const account = await getAccount(connection, ata, "confirmed", program);
    return Number(account.amount) / 10 ** decimals;
  } catch {
    return 0;
  }
}

/** Transfer any SPL token (classic or Token-2022) from the custody hot wallet. */
export async function transferSplFromHotWallet(opts: {
  mintAddress: string;
  decimals: number;
  toAddress: string;
  amount: number;
}): Promise<{ signature: string; demo: boolean }> {
  if (config.demoMode) {
    throw new Error("Refusing demo/fake SPL transfer");
  }
  if (!hasHotWallet()) {
    throw new Error("HOT_WALLET_SECRET not configured — real SPL transfer required");
  }
  const { Connection, Keypair, PublicKey, Transaction } = await import(
    "@solana/web3.js"
  );
  const {
    getAssociatedTokenAddress,
    createTransferCheckedInstruction,
    getAccount,
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddressSync,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  } = await import("@solana/spl-token");
  const bs58 = (await import("bs58")).default;

  const connection = new Connection(config.solanaRpcUrl, "confirmed");
  const payer = Keypair.fromSecretKey(bs58.decode(config.hotWalletSecret));
  const mint = new PublicKey(opts.mintAddress);
  const to = new PublicKey(opts.toAddress);
  const program = await tokenProgramForMint(connection, mint);

  const fromAta = await getAssociatedTokenAddress(
    mint,
    payer.publicKey,
    false,
    program
  );
  const toAta = getAssociatedTokenAddressSync(
    mint,
    to,
    false,
    program,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const tx = new Transaction();
  try {
    await getAccount(connection, toAta, "confirmed", program);
  } catch {
    tx.add(
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        toAta,
        to,
        mint,
        program,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  const rawAmount = BigInt(Math.round(opts.amount * 10 ** opts.decimals));
  tx.add(
    createTransferCheckedInstruction(
      fromAta,
      mint,
      toAta,
      payer.publicKey,
      rawAmount,
      opts.decimals,
      [],
      program
    )
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
