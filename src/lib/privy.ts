import { config, hasPrivyCreds } from "@/lib/config";
import type { PrivyClientLike, TwitterOAuthTokens } from "@/types";

/**
 * Privy server auth — X OAuth identity + embedded Solana wallets.
 *
 * GAP (documented): @privy-io/server-auth getUser does NOT return Twitter
 * provider OAuth access/refresh tokens. Privy only exposes those via the
 * React `useOAuthTokens` hook when the dashboard has:
 *   1) Custom Twitter OAuth credentials configured
 *   2) "Return OAuth tokens" toggled ON
 *   3) Scopes including offline.access + like.read (for liked_tweets)
 * Client captures tokens and POSTs them to /api/auth/sync for server storage.
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
      async getUserTwitterOAuthTokens() {
        return null;
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
    async getUserTwitterOAuthTokens(
      privyDid: string
    ): Promise<TwitterOAuthTokens | null> {
      // Probe getUser for any future token fields Privy might add.
      // Today linked twitter_oauth accounts only expose subject/username/name/profilePictureUrl.
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
        ) as Record<string, unknown> | undefined;
        if (!tw) return null;
        const access =
          (typeof tw.accessToken === "string" && tw.accessToken) ||
          (typeof tw.oauthAccessToken === "string" && tw.oauthAccessToken) ||
          (typeof tw.token === "string" && tw.token) ||
          null;
        if (!access) {
          console.info(
            "[privy] No Twitter OAuth tokens on getUser — enable dashboard " +
              '"Return OAuth tokens" + custom Twitter credentials; client ' +
              "useOAuthTokens → /api/auth/sync is the supported path."
          );
          return null;
        }
        const refresh =
          (typeof tw.refreshToken === "string" && tw.refreshToken) ||
          (typeof tw.oauthRefreshToken === "string" && tw.oauthRefreshToken) ||
          null;
        const expiresIn =
          typeof tw.accessTokenExpiresInSeconds === "number"
            ? tw.accessTokenExpiresInSeconds
            : typeof tw.expiresIn === "number"
              ? tw.expiresIn
              : null;
        return {
          accessToken: access,
          refreshToken: refresh,
          expiresAt:
            expiresIn != null
              ? new Date(Date.now() + expiresIn * 1000)
              : null,
        };
      } catch (e) {
        console.error("[privy] getUserTwitterOAuthTokens failed", e);
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
