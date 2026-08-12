import { config, hasPrivyCreds } from "@/lib/config";
import type { PrivyClientLike } from "@/types";

/**
 * Privy server auth — X OAuth identity + embedded Solana wallets.
 * Live verification when NEXT_PUBLIC_PRIVY_APP_ID + PRIVY_APP_SECRET are set.
 * Falls back to demo verifier only when DEMO_MODE or creds missing.
 */
export function createPrivyClient(): PrivyClientLike {
  if (!hasPrivyCreds()) {
    return {
      async verifyAuthToken(token: string) {
        if (!token) return null;
        const username = token.startsWith("demo:")
          ? token.slice(5)
          : "heettike";
        return {
          userId: `did:privy:demo-${username}`,
          walletAddress: `DemoWallet_${username}`,
        };
      },
      async getSolanaWallet(privyDid: string) {
        return `DemoWallet_${privyDid.replace(/\W/g, "").slice(-12)}`;
      },
      async getUserTwitter(privyDid: string) {
        const u = privyDid.replace("did:privy:demo-", "") || "heettike";
        return { username: u, subject: `demo_x_${u}` };
      },
    };
  }

  return {
    async verifyAuthToken(token: string) {
      try {
        const { PrivyClient } = await import("@privy-io/server-auth");
        const client = new PrivyClient(
          config.privyAppId,
          config.privyAppSecret
        );
        const claims = await client.verifyAuthToken(token);
        return { userId: claims.userId };
      } catch (e) {
        console.error("[privy] verifyAuthToken failed", e);
        return null;
      }
    },
    async getSolanaWallet(privyDid: string) {
      try {
        const { PrivyClient } = await import("@privy-io/server-auth");
        const client = new PrivyClient(
          config.privyAppId,
          config.privyAppSecret
        );
        const user = await client.getUser(privyDid);
        const sol = user.linkedAccounts?.find(
          (a: { type?: string; chainType?: string; address?: string }) =>
            a.type === "wallet" &&
            (a.chainType === "solana" ||
              (a as { chainId?: string }).chainId === "solana:mainnet")
        ) as { address?: string } | undefined;
        return sol?.address ?? null;
      } catch (e) {
        console.error("[privy] getSolanaWallet failed", e);
        return null;
      }
    },
    async getUserTwitter(privyDid: string) {
      try {
        const { PrivyClient } = await import("@privy-io/server-auth");
        const client = new PrivyClient(
          config.privyAppId,
          config.privyAppSecret
        );
        const user = await client.getUser(privyDid);
        const tw = user.linkedAccounts?.find(
          (a: { type?: string }) =>
            a.type === "twitter_oauth" || a.type === "twitter"
        ) as
          | { username?: string; subject?: string; name?: string }
          | undefined;
        if (!tw) return null;
        return {
          username: (tw.username || tw.name || "").replace(/^@/, ""),
          subject: tw.subject || "",
        };
      } catch (e) {
        console.error("[privy] getUserTwitter failed", e);
        return null;
      }
    },
  };
}

export function privyConfigured(): boolean {
  return hasPrivyCreds();
}

/** Extract Bearer token from Authorization header */
export function bearerFromRequest(req: {
  headers: { get(name: string): string | null };
}): string | null {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}
