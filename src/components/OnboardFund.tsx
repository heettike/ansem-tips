"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { LoginButton } from "@/components/LoginButton";
import { LiveTipSettingsForm } from "@/components/LiveTipSettingsForm";
import type { TipAmountSettings } from "@/types";

const WALLET_PLACEHOLDER = "log in with x — your deposit address shows up here";

export function OnboardFund({
  minDepositUsd,
  minTip,
  allowlist,
  initial,
}: {
  minDepositUsd: number;
  minTip: number;
  allowlist: string[];
  initial: TipAmountSettings;
}) {
  const [username, setUsername] = useState<string | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [deposited, setDeposited] = useState<number | null>(null);

  const loadDeposit = useCallback(
    async (u: string, fallbackWallet?: string | null) => {
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
    },
    []
  );

  const allowed =
    !!username && allowlist.includes(username.replace(/^@/, "").toLowerCase());

  return (
    <>
      <ol className="space-y-6">
        <li className="poster-card">
          <div className="flex items-center justify-between gap-4">
            <p className="micro-label">step</p>
            <span className="pill">01</span>
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight">
            log in with x
          </h2>
          <p className="mt-3 text-muted">
            one login. we create your tip deposit wallet. don&apos;t paste keys.
          </p>
          <div className="mt-5">
            <LoginButton
              label="log in with x"
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
          {username && <p className="mt-3 text-sm mark">@{username}</p>}
          {username && !allowed && (
            <div className="mt-6 rounded-2xl border border-danger/30 p-4 text-sm text-danger">
              you&apos;re not on the tipper list. ask whoever runs this.
            </div>
          )}
        </li>

        <li className="poster-card">
          <div className="flex items-center justify-between gap-4">
            <p className="micro-label">step</p>
            <span className="pill">02</span>
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight">
            deposit min {minDepositUsd} $ansem
          </h2>
          {username ? (
            <>
              <p className="mt-3 text-muted">
                send $ansem to @{username}&apos;s deposit address. funded so
                far:{" "}
                <span className="gold">
                  {deposited == null
                    ? "…"
                    : `${deposited.toFixed(2)} $ansem`}
                </span>
              </p>
              <div className="mt-5 break-all rounded-2xl border border-black/[0.08] bg-[#fafafa] p-4 text-sm text-black/70">
                {wallet || WALLET_PLACEHOLDER}
              </div>
            </>
          ) : (
            <p className="mt-3 text-muted">{WALLET_PLACEHOLDER}</p>
          )}
        </li>

        <li className="poster-card">
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="micro-label">step</p>
            <span className="pill">03</span>
          </div>
          {username ? (
            <LiveTipSettingsForm initial={initial} minTip={minTip} />
          ) : (
            <div>
              <h3 className="text-2xl font-bold tracking-tight">
                tip amounts
              </h3>
              <p className="mt-3 text-muted">
                log in with x first — then set how much leaves your wallet.
              </p>
            </div>
          )}
        </li>
      </ol>

      <div className="mt-6 flex flex-wrap gap-3">
        {username ? (
          <Link href="/dashboard" className="btn-primary">
            open dash
          </Link>
        ) : (
          <Link href="/dashboard" className="btn-ghost">
            dash after login
          </Link>
        )}
        <Link href="/" className={username ? "btn-ghost" : "btn-primary"}>
          home
        </Link>
      </div>
    </>
  );
}
