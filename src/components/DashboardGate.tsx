"use client";

import { useState } from "react";
import Link from "next/link";
import { BalanceCard } from "@/components/BalanceCard";
import { TipsTable } from "@/components/TipsTable";
import { LoginButton } from "@/components/LoginButton";
import { XSessionProvider, useXSession } from "@/components/XSession";
import type { BalanceView } from "@/types";

const EMPTY_BALANCE: BalanceView = {
  deposited: 0,
  withdrawable: 0,
  lifetimeSent: 0,
  lifetimeReceived: 0,
  walletAddress: null,
};

export function DashboardGate({ allowlist }: { allowlist: string[] }) {
  return (
    <XSessionProvider role="tipper">
      <DashboardInner allowlist={allowlist} />
    </XSessionProvider>
  );
}

function DashboardInner({ allowlist }: { allowlist: string[] }) {
  const session = useXSession();
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
  const [accessStatus, setAccessStatus] = useState<string | null>(null);

  const allowed =
    (!!username &&
      allowlist.includes(username.replace(/^@/, "").toLowerCase())) ||
    accessStatus === "approved" ||
    session.accessStatus === "approved";
  const waitlisted = !!username && !allowed;

  async function loadMine(u: string) {
    setError(null);
    try {
      const [balRes, tipRes] = await Promise.all([
        fetch(`/api/balance?username=${encodeURIComponent(u)}&role=tipper`),
        fetch(`/api/tips/sent?username=${encodeURIComponent(u)}`),
      ]);
      const bal = await balRes.json();
      const sent = await tipRes.json();
      if (bal.ok && bal.accessStatus) setAccessStatus(bal.accessStatus);
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
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <div className="poster-card">
          <p className="micro-label">tipper</p>
          <h1 className="display mt-8 text-[clamp(2rem,6vw,3rem)]">
            your dash
          </h1>
          <p className="mt-4 max-w-md text-muted">
            log in as you to see your tips — not someone else&apos;s.
          </p>
          <p className="mt-3 max-w-md text-muted">
            recipients cash out on{" "}
            <Link
              href="/withdraw"
              className="text-ink underline underline-offset-4"
            >
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
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-5 pb-24 pt-10">
      <div className="poster-card">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="micro-label">tipper</p>
            <h1 className="display mt-3 text-[clamp(2rem,5vw,2.75rem)]">
              @{username}
            </h1>
            <p className="mt-4 max-w-md text-muted">
              {waitlisted
                ? "you're on the waitlist. we approve tippers by hand — check back soon."
                : !allowed
                ? "log in with x to join the waitlist."
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
      </div>

      {allowed && (
        <>
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <div className="poster-card">
              <BalanceCard title="tipper balance" balance={balance} />
            </div>
            <div className="poster-card">
              <p className="micro-label">what&apos;s running</p>
              <ul className="mt-6 space-y-3 text-lg text-body">
                <li>
                  each like / reply / follow / qt / 🐂 sends $ansem to their
                  wallet on-chain.
                </li>
                <li>cash out is on withdraw.</li>
                <li>
                  tips start after you log in — we don&apos;t pay old likes/follows.
                </li>
                <li>same action never tips twice.</li>
                <li>empty means nothing tipped yet — not fake numbers.</li>
              </ul>
            </div>
          </div>

          <div className="poster-card">
            <TipsTable tips={tips} />
          </div>
        </>
      )}
    </div>
  );
}
