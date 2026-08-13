"use client";

import { useState } from "react";
import Link from "next/link";
import { BalanceCard } from "@/components/BalanceCard";
import { TipsTable } from "@/components/TipsTable";
import { LoginButton } from "@/components/LoginButton";
import type { BalanceView } from "@/types";

const EMPTY_BALANCE: BalanceView = {
  deposited: 0,
  withdrawable: 0,
  lifetimeSent: 0,
  lifetimeReceived: 0,
  walletAddress: null,
};

export function DashboardGate({ allowlist }: { allowlist: string[] }) {
  const [username, setUsername] = useState<string | null>(null);
  const [balance, setBalance] = useState<BalanceView>(EMPTY_BALANCE);
  const [tips, setTips] = useState<
    Array<{
      id: string;
      actionType: string;
      toXUsername: string;
      amount: number;
      status: string;
      txSig?: string | null;
      createdAt: string;
    }>
  >([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowed =
    !!username && allowlist.includes(username.replace(/^@/, "").toLowerCase());

  async function loadMine(u: string) {
    setError(null);
    try {
      const [balRes, tipRes] = await Promise.all([
        fetch(`/api/balance?username=${encodeURIComponent(u)}&role=tipper`),
        fetch(`/api/tips/sent?username=${encodeURIComponent(u)}`),
      ]);
      const bal = await balRes.json();
      const sent = await tipRes.json();
      if (bal.ok && bal.balance) {
        setBalance({
          deposited: Number(bal.balance.deposited) || 0,
          withdrawable: Number(bal.balance.withdrawable) || 0,
          lifetimeSent: Number(bal.balance.lifetimeSent) || 0,
          lifetimeReceived: Number(bal.balance.lifetimeReceived) || 0,
          walletAddress: bal.balance.walletAddress ?? null,
        });
      } else {
        setBalance({ ...EMPTY_BALANCE });
      }
      setTips(Array.isArray(sent.tips) ? sent.tips : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "couldn't load your dash");
      setBalance({ ...EMPTY_BALANCE });
      setTips([]);
    } finally {
      setLoaded(true);
    }
  }

  if (!username) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-sm text-muted">tipper</p>
        <h1 className="display mt-3 text-4xl sm:text-6xl">your dash</h1>
        <p className="mt-4 max-w-md text-muted">
          log in as you to see your tips — not someone else&apos;s.
        </p>
        <p className="mt-3 max-w-md text-muted">
          recipients cash out on{" "}
          <Link href="/withdraw" className="text-white underline underline-offset-4">
            withdraw
          </Link>
          .
        </p>
        <div className="mt-10">
          <LoginButton
            label="log in with x"
            onAuthed={(info) => {
              const u = info.username
                ? info.username.replace(/^@/, "").toLowerCase()
                : null;
              setUsername(u);
              if (u) void loadMine(u);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-sm text-muted">tipper</p>
          <h1 className="display mt-3 text-4xl sm:text-6xl">@{username}</h1>
          <p className="mt-4 max-w-md text-muted">
            {!allowed
              ? "you're not on the tipper list. ask whoever runs this."
              : loaded
                ? "your balances — real numbers only"
                : "loading your numbers…"}
          </p>
          {error && (
            <p className="mt-3 max-w-lg break-all text-xs text-danger">
              {error.slice(0, 160)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LoginButton label="log in with x" className="btn-ghost" />
          <Link href="/onboard" className="btn-ghost">
            settings
          </Link>
        </div>
      </div>

      {allowed && (
        <>
          <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
            <BalanceCard title="tipper balance" balance={balance} />
            <div>
              <p className="text-sm text-muted">what&apos;s running</p>
              <ul className="mt-5 space-y-3 text-lg text-muted">
                <li>
                  each like / reply / follow / qt / 🐂 sends $ansem from your
                  wallet to theirs.
                </li>
                <li>same action never tips twice.</li>
                <li>empty means nothing tipped yet — not fake numbers.</li>
              </ul>
            </div>
          </div>

          <div className="mt-16">
            <TipsTable tips={tips} />
          </div>
        </>
      )}
    </div>
  );
}
