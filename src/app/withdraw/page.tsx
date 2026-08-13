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
          `sent — <a href="${url}" target="_blank" rel="noreferrer" class="text-accent hover:underline">view receipt</a>`
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
          data.result?.error || data.error || "withdraw failed. try again."
        );
      }
    } catch (err) {
      setStatusError(
        err instanceof Error ? err.message : "network blip — try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const lifetime = balance.lifetimeReceived || 0;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-sm text-muted">recipient</p>
      <h1 className="display mt-4 text-4xl sm:text-6xl">
        withdraw <span className="gold">$ansem</span>
      </h1>
      <p className="mt-5 text-muted">
        log in with x. tips already hit your wallet on-chain. cash out leftover
        balance here.
      </p>

      <div className="mt-10">
        <LoginButton
          label="log in with x"
          role="recipient"
          onAuthed={async (info) => {
            if (info.username) {
              setUsername(info.username);
              await refreshAll(info.username);
            }
            setToAddress((prev) => prev || info.walletAddress || "");
            setUserId(null);
          }}
        />
        {!username && (
          <p className="mt-4 text-sm text-muted">
            not signed in yet — balances stay empty until you log in.
          </p>
        )}
      </div>

      <div className="mt-16 grid gap-10 sm:grid-cols-3">
        <div>
          <p className="text-sm text-muted">lifetime</p>
          <p className="display mt-2 text-3xl gold">${lifetime.toFixed(2)}</p>
          {livePriceUsd != null && (
            <p className="mt-2 text-xs text-muted">
              spot ≈ ${(lifetime * livePriceUsd).toFixed(6)}
            </p>
          )}
        </div>
        <div>
          <p className="text-sm text-muted">withdrawable</p>
          <p className="display mt-2 text-3xl gold">
            ${balance.withdrawable.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted">withdrawn</p>
          <p className="display mt-2 text-3xl">${totalWithdrawn.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-16">
        <BalanceCard
          title="earned balance"
          balance={balance}
          highlight="withdrawable"
        />
      </div>

      <div className="mt-16">
        <ReceivedTipsFeed tips={tips} />
      </div>

      <div className="mt-16">
        <WithdrawalHistory withdrawals={withdrawals} />
      </div>

      <form onSubmit={onWithdraw} className="mt-16 space-y-6 border-t border-[#222] pt-12">
        <p className="display text-3xl">cash out</p>
        <label className="block">
          <span className="mb-2 block text-sm text-muted">
            destination wallet
          </span>
          <input
            className="input"
            placeholder="your wallet address"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            required
            minLength={32}
          />
        </label>

        <label className="block">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-sm text-muted">amount ($ansem)</span>
            <button
              type="button"
              className="text-sm text-accent hover:underline"
              onClick={() => setAmount(Number(balance.withdrawable) || 0)}
            >
              max ({balance.withdrawable.toFixed(2)})
            </button>
          </div>
          <input
            className="input"
            type="number"
            min={0.01}
            step="0.01"
            max={balance.withdrawable || undefined}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            required
          />
        </label>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "sending…" : "withdraw"}
        </button>

        {statusHtml && (
          <p
            className="break-all text-sm text-muted"
            dangerouslySetInnerHTML={{ __html: statusHtml }}
          />
        )}
        {statusError && (
          <p className="break-all border border-danger p-3 text-sm text-danger">
            {statusError}
          </p>
        )}
      </form>
    </div>
  );
}
