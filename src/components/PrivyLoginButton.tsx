"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";

type Props = {
  label: string;
  className: string;
  onAuthed?: (info: {
    privyDid: string;
    username?: string;
    walletAddress?: string | null;
  }) => void;
};

export default function PrivyLoginButton({ label, className, onAuthed }: Props) {
  const { ready, authenticated, user, login, logout, getAccessToken } =
    usePrivy();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!authenticated || !user) return;
    let cancelled = false;
    (async () => {
      setSyncing(true);
      try {
        const token = await getAccessToken();
        const solAccount = user.linkedAccounts?.find(
          (a) =>
            "chainType" in a &&
            (a as { type?: string; chainType?: string }).type === "wallet" &&
            (a as { chainType?: string }).chainType === "solana"
        ) as { address?: string } | undefined;
        const sol =
          solAccount?.address ||
          user.wallet?.address ||
          null;
        const res = await fetch("/api/auth/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ walletAddress: sol }),
        });
        const data = await res.json();
        if (!cancelled && data.ok) {
          onAuthed?.({
            privyDid: user.id,
            username: data.username,
            walletAddress: data.walletAddress ?? sol,
          });
        }
      } catch (e) {
        console.error("[PrivyLoginButton] sync failed", e);
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, user?.id]);

  if (!ready) {
    return (
      <button type="button" className={className} disabled>
        Loading…
      </button>
    );
  }

  if (authenticated && user) {
    const handle = user.twitter?.username || user.id.slice(0, 12);
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge">
          @{handle}
          {syncing ? " · syncing" : ""}
        </span>
        <button type="button" className="btn-ghost" onClick={() => logout()}>
          Log out
        </button>
      </div>
    );
  }

  return (
    <button type="button" className={className} onClick={() => login()}>
      {label}
    </button>
  );
}
