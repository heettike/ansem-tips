"use client";

import { useState } from "react";
import { BalanceCard } from "@/components/BalanceCard";
import { LoginButton } from "@/components/LoginButton";
import { ReceivedTipsFeed } from "@/components/ReceivedTipsFeed";
import {
  WithdrawalHistory,
  type WithdrawalRow,
} from "@/components/WithdrawalHistory";
import type { BalanceView } from "@/types";

type ReceivedTip = {
  id: string;
  actionType: string;
  amount: number;
  amountUsd?: number;
  status: string;
  createdAt: string;
  fromUsername: string;
  tweetId: string | null;
  tweetUrl: string | null;
};

const EMPTY_BALANCE: BalanceView = {
  deposited: 0,
  withdrawable: 0,
  lifetimeSent: 0,
  lifetimeReceived: 0,
  walletAddress: null,
};

function friendlyWithdrawError(raw: unknown): string {
  const msg = typeof raw === "string" ? raw : "";
  if (!msg) return "Withdraw didn’t go through. Try again in a bit.";
  if (/demo/i.test(msg)) {
    return "Demo mode is on — withdraws are paused right now.";
  }
  if (/insufficient|too low|balance is 0|nothing to withdraw/i.test(msg)) {
    return "Nothing to withdraw yet — your tip balance is 0 (or too low for that amount).";
  }
  if (/not found|sign in|userId|xUsername/i.test(msg)) {
    return "Sign in with X first, then withdraw.";
  }
  if (/address|amount|validation|looks off|flatten/i.test(msg)) {
    return "Check your wallet address and amount — something looks off.";
  }
  return msg;
}

export default function WithdrawPage() {
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState(0);
  const [statusHtml, setStatusHtml] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<BalanceView>(EMPTY_BALANCE);
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [tips, setTips] = useState<ReceivedTip[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [livePriceUsd, setLivePriceUsd] = useState<number | null>(null);
  const [authed, setAuthed] = useState(false);

  async function refreshBalance(u: string) {
    const res = await fetch(
      `/api/balance?username=${encodeURIComponent(u)}&role=recipient`
    );
    const data = await res.json();
    if (data.ok && data.balance) {
      setBalance(data.balance);
      setAmount(Number(data.balance.withdrawable) || 0);
      if (data.balance.walletAddress) setToAddress(data.balance.walletAddress);
    }
  }

  async function refreshTips(u: string) {
    const res = await fetch(
      `/api/tips/received?username=${encodeURIComponent(u)}`
    );
    const data = await res.json();
    if (data.ok && Array.isArray(data.tips)) setTips(data.tips);
  }

  async function refreshWithdrawals(u: string) {
    const res = await fetch(
      `/api/withdrawals?username=${encodeURIComponent(u)}`
    );
    const data = await res.json();
    if (data.ok && Array.isArray(data.withdrawals)) {
      setWithdrawals(data.withdrawals);
      setTotalWithdrawn(Number(data.totalWithdrawn) || 0);
    }
  }

  async function refreshPrice() {
    try {
      const res = await fetch("/api/price/ansem");
      const data = await res.json();
      if (data.ok && typeof data.priceUsd === "number") {
        setLivePriceUsd(data.priceUsd);
      }
    } catch {
      /* optional */
    }
  }

  async function refreshAll(u: string) {
    await Promise.all([
      refreshBalance(u),
      refreshTips(u),
      refreshWithdrawals(u),
      refreshPrice(),
    ]);
  }

  async function onWithdraw(e: React.FormEvent) {
    e.preventDefault();
    if (balance.withdrawable <= 0) return;
    setLoading(true);
    setStatusHtml(null);
    setStatusError(null);
    try {
      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toAddress,
          amount,
          ...(userId ? { userId } : {}),
          ...(username ? { xUsername: username } : {}),
        }),
      });
      const data = await res.json();
      if (data.ok && data.result?.success && data.result.txSig) {
        const sig = data.result.txSig as string;
        const url = `https://solscan.io/tx/${sig}`;
        setStatusHtml(
          `Withdraw submitted — <a href="${url}" target="_blank" rel="noreferrer" class="text-accent hover:underline">View on Solscan</a>`
        );
        if (username) {
          await refreshAll(username);
        } else {
          setBalance((b) => ({
            ...b,
            withdrawable: Math.max(0, b.withdrawable - amount),
            walletAddress: toAddress,
          }));
        }
        setAmount(0);
      } else {
        setStatusError(
          friendlyWithdrawError(data.result?.error || data.error)
        );
      }
    } catch (err) {
      setStatusError(
        friendlyWithdrawError(
          err instanceof Error ? err.message : "Request failed"
        )
      );
    } finally {
      setLoading(false);
    }
  }

  const lifetime = balance.lifetimeReceived || 0;
  const canWithdraw = balance.withdrawable > 0 && !loading;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="badge badge-bull">Recipient</p>
      <h1 className="stadium-banner mt-3 text-3xl sm:text-4xl">
        Withdraw <span className="line-gold">$ansem</span>
      </h1>
      <p className="mt-2 text-muted">
        Sign in with X. See what you earned. Cash out to your wallet.
      </p>

      <div className="mt-6">
        <LoginButton
          label="Sign in with X"
          onAuthed={async (info) => {
            setAuthed(true);
            if (info.username) {
              setUsername(info.username);
              await refreshAll(info.username);
            }
            if (info.walletAddress) setToAddress(info.walletAddress);
            setUserId(null);
          }}
        />
      </div>

      {authed && balance.withdrawable <= 0 && (
        <div className="empty-state mt-8">
          <p className="empty-title">Nothing to withdraw yet</p>
          <p className="empty-body">
            Tips show up after a tipper likes, replies, follows, or QTs you.
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="label-mono">Lifetime earned</p>
          <p className="mt-1 font-mono text-xl font-semibold gold-glow">
            {lifetime.toFixed(2)}{" "}
            <span className="text-sm text-accent-2">$ansem</span>
          </p>
          {livePriceUsd != null && (
            <p className="mt-0.5 font-mono text-[10px] text-muted">
              ≈ ${(lifetime * livePriceUsd).toFixed(6)}
            </p>
          )}
        </div>
        <div className="card p-4">
          <p className="label-mono">Withdrawable</p>
          <p className="mt-1 font-mono text-xl font-semibold text-accent-2">
            {balance.withdrawable.toFixed(2)}{" "}
            <span className="text-sm">$ansem</span>
          </p>
        </div>
        <div className="card p-4">
          <p className="label-mono">Withdrawn</p>
          <p className="mt-1 font-mono text-xl font-semibold">
            {totalWithdrawn.toFixed(2)}{" "}
            <span className="text-sm text-accent-2">$ansem</span>
          </p>
        </div>
      </div>

      <div className="mt-6">
        <BalanceCard
          title="Earned balance"
          balance={balance}
          highlight="withdrawable"
        />
      </div>

      <div className="mt-6">
        <ReceivedTipsFeed tips={tips} />
      </div>

      <div className="mt-6">
        <WithdrawalHistory withdrawals={withdrawals} />
      </div>

      <form onSubmit={onWithdraw} className="card mt-6 space-y-4 p-5">
        <p className="label-mono text-accent">Cash out</p>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Destination wallet</span>
          <input
            className="input font-mono"
            placeholder="Your wallet address"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            required
            minLength={32}
            disabled={balance.withdrawable <= 0}
          />
        </label>

        <label className="block text-sm">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-muted">Amount ($ansem)</span>
            <button
              type="button"
              className="font-mono text-xs font-semibold uppercase tracking-wide text-accent hover:underline disabled:opacity-40"
              onClick={() => setAmount(Number(balance.withdrawable) || 0)}
              disabled={balance.withdrawable <= 0}
            >
              Max ({balance.withdrawable.toFixed(2)})
            </button>
          </div>
          <input
            className="input font-mono"
            type="number"
            min={0.01}
            step="0.01"
            max={balance.withdrawable || undefined}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            required
            disabled={balance.withdrawable <= 0}
          />
        </label>

        <button type="submit" className="btn-primary" disabled={!canWithdraw}>
          {loading
            ? "Sending…"
            : balance.withdrawable <= 0
              ? "Nothing to withdraw"
              : "Withdraw"}
        </button>

        {statusHtml && (
          <p
            className="break-all text-sm text-muted"
            dangerouslySetInnerHTML={{ __html: statusHtml }}
          />
        )}
        {statusError && (
          <p className="break-all text-sm text-danger">{statusError}</p>
        )}
      </form>
    </div>
  );
}
