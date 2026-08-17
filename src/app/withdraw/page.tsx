"use client";

import { useState } from "react";
import { BalanceCard } from "@/components/BalanceCard";
import { LoginButton } from "@/components/LoginButton";
import { XSessionProvider, useXSession } from "@/components/XSession";
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

type TokenBalanceRow = {
  chain: string;
  tokenAddress: string;
  symbol: string;
  decimals: number;
  deposited: number;
  withdrawable: number;
};

const DEFAULT_TOKEN = "ansem:solana:";

const EMPTY_BALANCE: BalanceView = {
  deposited: 0,
  withdrawable: 0,
  lifetimeSent: 0,
  lifetimeReceived: 0,
  walletAddress: null,
};

export default function WithdrawPage() {
  return (
    <XSessionProvider role="recipient">
      <WithdrawInner />
    </XSessionProvider>
  );
}

function WithdrawInner() {
  const session = useXSession();
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
  const [checkName, setCheckName] = useState("");
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [tokenBalances, setTokenBalances] = useState<TokenBalanceRow[]>([]);
  const [selectedToken, setSelectedToken] = useState(DEFAULT_TOKEN);

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
    if (data.ok && Array.isArray(data.tokenBalances)) {
      setTokenBalances(
        data.tokenBalances.filter((t: TokenBalanceRow) => t.withdrawable > 0)
      );
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

  async function onCheckTips(e: React.FormEvent) {
    e.preventDefault();
    const u = checkName.replace(/^@/, "").trim().toLowerCase();
    if (!u) return;
    setChecking(true);
    setCheckResult(null);
    try {
      const res = await fetch(
        `/api/balance?username=${encodeURIComponent(u)}&role=recipient`
      );
      const data = await res.json();
      const w = Number(data?.balance?.withdrawable) || 0;
      setCheckResult(
        w > 0
          ? `@${u} has $${w.toFixed(2)} in $ansem waiting — sign in with x to withdraw.`
          : `no unclaimed tips for @${u} yet.`
      );
    } catch {
      setCheckResult("lookup failed — try again.");
    } finally {
      setChecking(false);
    }
  }

  async function onWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatusHtml(null);
    setStatusError(null);
    try {
      const picked = tokenBalances.find(
        (t) => `${t.symbol}:${t.chain}:${t.tokenAddress}` === selectedToken
      );
      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toAddress,
          amount,
          ...(picked
            ? {
                chain: picked.chain,
                tokenAddress: picked.tokenAddress,
                tokenSymbol: picked.symbol,
                tokenDecimals: picked.decimals,
              }
            : {}),
          ...(userId ? { userId } : {}),
          ...(username ? { xUsername: username } : {}),
        }),
      });
      const data = await res.json();
      if (data.ok && data.result?.success && data.result.txSig) {
        const sig = data.result.txSig as string;
        const explorers: Record<string, string> = {
          base: "https://basescan.org/tx/",
          bsc: "https://bscscan.com/tx/",
        };
        const url = `${
          (picked && explorers[picked.chain]) || "https://solscan.io/tx/"
        }${sig}`;
        setStatusHtml(
          `sent — <a href="${url}" target="_blank" rel="noreferrer" class="text-ink underline underline-offset-4">view receipt</a>`
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
    <div className="mx-auto max-w-2xl space-y-6 px-5 pb-24 pt-10">
      {/* login + username check */}
      <section className="poster-card">
        <p className="micro-label">recipient</p>

        <h1 className="display mt-8 text-[clamp(2rem,6vw,3rem)]">
          withdraw <span className="gold">$ansem</span>
        </h1>
        <p className="mt-5 text-muted">
          log in with x. tips already hit your wallet on-chain. cash out leftover
          balance here.
        </p>

        <div className="mt-8">
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
          {session.status === "out" && !username && (
            <>
              <form onSubmit={onCheckTips} className="mt-8 flex gap-3">
                <input
                  className="input flex-1"
                  placeholder="your x username — check for tips"
                  value={checkName}
                  onChange={(e) => setCheckName(e.target.value)}
                />
                <button type="submit" className="btn-primary" disabled={checking}>
                  {checking ? "checking…" : "check"}
                </button>
              </form>
              {checkResult && (
                <p className="mt-3 text-sm text-muted">{checkResult}</p>
              )}
              <p className="caption mt-4">
                unclaimed tips return to the creator after 30 days.
              </p>
            </>
          )}
        </div>
      </section>

      {/* core numbers */}
      <section className="poster-card">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="micro-label">lifetime</p>
            <p className="display mt-2 text-3xl gold">${lifetime.toFixed(2)}</p>
            {livePriceUsd != null && (
              <p className="mt-2 text-xs text-muted">
                spot ≈ ${(lifetime * livePriceUsd).toFixed(6)}
              </p>
            )}
          </div>
          <div>
            <p className="micro-label">withdrawable</p>
            <p className="display mt-2 text-3xl gold">
              ${balance.withdrawable.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="micro-label">withdrawn</p>
            <p className="display mt-2 text-3xl">${totalWithdrawn.toFixed(2)}</p>
          </div>
        </div>
      </section>

      <section className="poster-card">
        <BalanceCard
          title="earned balance"
          balance={balance}
          highlight="withdrawable"
        />
      </section>

      <section className="poster-card">
        <ReceivedTipsFeed tips={tips} />
      </section>

      <section className="poster-card">
        <WithdrawalHistory withdrawals={withdrawals} />
      </section>

      <section className="poster-card">
        <form onSubmit={onWithdraw} className="space-y-6">
          <p className="display text-3xl">cash out</p>
          {tokenBalances.length > 0 && (
            <label className="block">
              <span className="mb-2 block text-sm text-muted">
                coin{" "}
                <span className="opacity-70">
                  (one withdraw per coin — pick which to cash out)
                </span>
              </span>
              <select
                className="input"
                value={selectedToken}
                onChange={(e) => {
                  setSelectedToken(e.target.value);
                  const t = tokenBalances.find(
                    (row) =>
                      `${row.symbol}:${row.chain}:${row.tokenAddress}` ===
                      e.target.value
                  );
                  setAmount(
                    t ? t.withdrawable : Number(balance.withdrawable) || 0
                  );
                }}
              >
                <option value={DEFAULT_TOKEN}>
                  $ansem on solana ({balance.withdrawable.toFixed(2)})
                </option>
                {tokenBalances.map((t) => (
                  <option
                    key={`${t.chain}:${t.tokenAddress}`}
                    value={`${t.symbol}:${t.chain}:${t.tokenAddress}`}
                  >
                    {t.symbol} on {t.chain} ({t.withdrawable.toFixed(4)})
                  </option>
                ))}
              </select>
            </label>
          )}
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
                className="text-sm text-ink underline-offset-4 hover:underline"
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
            <p className="break-all rounded-lg border border-danger/30 p-3 text-sm text-danger">
              {statusError}
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
