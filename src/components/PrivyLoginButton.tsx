"use client";

import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { useEffect, useMemo, useState } from "react";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";

type Props = {
  label?: string;
  className?: string;
  onAuthed?: (info: {
    privyDid: string;
    username?: string;
    walletAddress?: string | null;
  }) => void;
};

function LoginInner({ label, className, onAuthed }: Props) {
  const { ready, authenticated, user, login, getAccessToken } = usePrivy();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready || !authenticated || !user) return;
    let cancelled = false;
    (async () => {
      try {
        setBusy(true);
        const token = await getAccessToken();
        const twitter = user.twitter as { username?: string } | undefined;
        const sol =
          user.wallet?.address ||
          (user.linkedAccounts || []).find(
            (a: { type?: string; address?: string }) =>
              a.type === "wallet" && a.address
          )?.address ||
          null;
        await fetch("/api/auth/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: "tipper" }),
        }).catch(() => null);
        if (!cancelled) {
          onAuthed?.({
            privyDid: user.id,
            username: twitter?.username,
            walletAddress: sol ?? null,
          });
        }
      } catch (e) {
        console.error("[PrivyLoginButton] sync failed", e);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, user, getAccessToken, onAuthed]);

  return (
    <button
      type="button"
      className={className}
      disabled={!ready || busy}
      onClick={() => login()}
    >
      {!ready ? "Loading…" : busy ? "Signing in…" : label}
    </button>
  );
}

export default function PrivyLoginButton(props: Props) {
  const appId = (process.env.NEXT_PUBLIC_PRIVY_APP_ID || "").trim();
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
        Privy not configured
      </button>
    );
  }

  return (
    <ClientErrorBoundary
      fallback={
        <button type="button" className={props.className} disabled>
          Auth unavailable
        </button>
      }
    >
      <PrivyProvider appId={appId} config={config}>
        <LoginInner {...props} />
      </PrivyProvider>
    </ClientErrorBoundary>
  );
}
