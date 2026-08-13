"use client";

import { publicEnv } from "@/lib/publicEnv";

import { PrivyProvider, useOAuthTokens, usePrivy } from "@privy-io/react-auth";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";

type Props = {
  label?: string;
  className?: string;
  role?: "tipper" | "recipient";
  onAuthed?: (info: {
    privyDid: string;
    username?: string;
    walletAddress?: string | null;
  }) => void;
};

type CapturedOAuth = {
  provider: string;
  accessToken: string;
  refreshToken?: string | null;
  accessTokenExpiresInSeconds?: number | null;
};

function LoginInner({ label, className, role = "tipper", onAuthed }: Props) {
  const { ready, authenticated, user, login, getAccessToken } = usePrivy();
  const [busy, setBusy] = useState(false);
  const oauthRef = useRef<CapturedOAuth | null>(null);
  const syncedFor = useRef<string | null>(null);

  const syncAccount = useCallback(
    async (oauth?: CapturedOAuth | null) => {
      if (!user) return;
      setBusy(true);
      try {
        const token = await getAccessToken();
        const twitter = user.twitter as { username?: string } | undefined;
        const linkedWallet = (user.linkedAccounts || []).find(
          (a) => a.type === "wallet" && "address" in a
        ) as { address?: string } | undefined;
        const primaryWallet = user.wallet as
          | { address?: string }
          | null
          | undefined;
        const sol = primaryWallet?.address || linkedWallet?.address || null;

        const tokens = oauth || oauthRef.current;
        await fetch("/api/auth/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            role,
            walletAddress: sol,
            ...(tokens
              ? {
                  oauthTokens: {
                    provider: tokens.provider,
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken ?? null,
                    accessTokenExpiresInSeconds:
                      tokens.accessTokenExpiresInSeconds ?? null,
                  },
                }
              : {}),
          }),
        }).catch(() => null);

        syncedFor.current = user.id;
        onAuthed?.({
          privyDid: user.id,
          username: twitter?.username,
          walletAddress: sol ?? null,
        });
      } catch (e) {
        console.error("[PrivyLoginButton] sync failed", e);
      } finally {
        setBusy(false);
      }
    },
    [user, getAccessToken, onAuthed, role]
  );

  // Must stay mounted on the page the user returns to after X OAuth.
  // Requires Privy dashboard: custom Twitter credentials + "Return OAuth tokens".
  useOAuthTokens({
    onOAuthTokenGrant: ({ oAuthTokens }) => {
      if (oAuthTokens.provider !== "twitter") {
        return;
      }
      const captured: CapturedOAuth = {
        provider: oAuthTokens.provider,
        accessToken: oAuthTokens.accessToken,
        refreshToken: oAuthTokens.refreshToken ?? null,
        accessTokenExpiresInSeconds:
          oAuthTokens.accessTokenExpiresInSeconds ?? null,
      };
      oauthRef.current = captured;
      void syncAccount(captured);
    },
  });

  useEffect(() => {
    if (!ready || !authenticated || !user) return;
    if (syncedFor.current === user.id && !oauthRef.current) return;
    void syncAccount(oauthRef.current);
  }, [ready, authenticated, user, syncAccount]);

  return (
    <button
      type="button"
      className={className}
      disabled={!ready || busy}
      onClick={() => login()}
    >
      {!ready ? "loading…" : busy ? "logging in…" : label}
    </button>
  );
}

export default function PrivyLoginButton(props: Props) {
  const appId = publicEnv.privyAppId;
  const config = useMemo(
    () => ({
      loginMethods: ["twitter"] as ("twitter")[],
      appearance: {
        theme: "dark" as const,
        accentColor: "#b6ff3b" as `#${string}`,
      },
      embeddedWallets: {
        solana: { createOnLogin: "users-without-wallets" as const },
        ethereum: { createOnLogin: "off" as const },
      },
    }),
    []
  );

  if (!appId) {
    return (
      <button type="button" className={props.className} disabled>
        log in with x — not configured
      </button>
    );
  }

  return (
    <ClientErrorBoundary
      fallback={
        <button type="button" className={props.className} disabled>
          log in with x — unavailable
        </button>
      }
    >
      <PrivyProvider appId={appId} config={config}>
        <LoginInner {...props} />
      </PrivyProvider>
    </ClientErrorBoundary>
  );
}
