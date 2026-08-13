"use client";

import { useCallback, useState } from "react";
import { LoginButton } from "@/components/LoginButton";

const WALLET_PLACEHOLDER = "log in with x — your deposit address shows up here";

export function OnboardFund({
  minDepositUsd,
  allowlist,
}: {
  minDepositUsd: number;
  allowlist: string[];
}) {
  const [username, setUsername] = useState<string | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [deposited, setDeposited] = useState<number | null>(null);

  const loadDeposit = useCallback(async (u: string, fallbackWallet?: string | null) => {
    try {
      const res = await fetch(
        `/api/balance?username=${encodeURIComponent(u)}&role=tipper`
      );
      const data = await res.json();
      if (data.ok && data.balance) {
        setDeposited(Number(data.balance.deposited) || 0);
        if (data.balance.walletAddress) {
          setWallet(data.balance.walletAddress);
          return;
        }
      } else {
        setDeposited(0);
      }
    } catch {
      setDeposited(0);
    }
    if (fallbackWallet) setWallet(fallbackWallet);
  }, []);

  const allowed =
    !!username && allowlist.includes(username.replace(/^@/, "").toLowerCase());

  return (
    <>
      <li>
        <p className="text-sm text-muted">01</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">
          log in with x
        </h2>
        <p className="mt-3 text-muted">
          one login. we create your tip deposit wallet. don&apos;t paste keys.
        </p>
        <div className="mt-5">
          <LoginButton
            label="continue with x"
            onAuthed={(info) => {
              const u = info.username
                ? info.username.replace(/^@/, "").toLowerCase()
                : null;
              setUsername(u);
              if (info.walletAddress) setWallet(info.walletAddress);
              if (u) void loadDeposit(u, info.walletAddress);
            }}
          />
        </div>
        {username && (
          <p className="mt-3 text-sm mark">@{username}</p>
        )}
        {username && !allowed && (
          <div className="mt-6 border border-danger p-4 text-sm text-danger">
            you&apos;re not on the tipper list. ask whoever runs this.
          </div>
        )}
      </li>

      <li>
        <p className="text-sm text-muted">02</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">
          deposit min ${minDepositUsd} $ansem
        </h2>
        {username ? (
          <p className="mt-3 text-muted">
            send $ansem to @{username}&apos;s deposit address. funded so far:{" "}
            <span className="gold">
              {deposited == null ? "…" : `$${deposited.toFixed(2)}`}
            </span>
          </p>
        ) : (
          <p className="mt-3 text-muted">
            log in first. then send $ansem to your wallet — not someone
            else&apos;s.
          </p>
        )}
        <div className="mt-5 border border-[#222] p-4 text-sm break-all text-muted">
          {wallet || WALLET_PLACEHOLDER}
        </div>
      </li>
    </>
  );
}
