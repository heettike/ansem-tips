"use client";

import { useState } from "react";
import { BalanceCard } from "@/components/BalanceCard";
import { LoginButton } from "@/components/LoginButton";
import { DEMO_RECIPIENT_BALANCE } from "@/lib/demo";

export default function WithdrawPage() {
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState(5);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(DEMO_RECIPIENT_BALANCE);
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  async function refreshBalance(u: string) {
    const res = await fetch(`/api/balance?username=${encodeURIComponent(u)}&role=recipient`);
    const data = await res.json();
    if (data.ok && data.balance) {
      setBalance(data.balance);
      if (data.balance.walletAddress) setToAddress(data.balance.walletAddress);
    }
  }

  async function onWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
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
      if (data.ok && data.result?.success) {
        setStatus(
          `Withdraw submitted${data.result.demo ? " (demo fallback)" : ""}: ${data.result.txSig}`
        );
        setBalance((b) => ({
          ...b,
          withdrawable: Math.max(0, b.withdrawable - amount),
          walletAddress: toAddress,
        }));
      } else {
        setStatus(data.result?.error || data.error || "Withdraw failed");
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="badge">Recipient</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">Withdraw $ansem</h1>
      <p className="mt-2 text-muted">
        Log in with X (Privy), see earned balance, send SPL $ansem to your personal
        Solana wallet. Custody hot wallet pays out — never commit{" "}
        <code className="text-accent">HOT_WALLET_SECRET</code>.
      </p>

      <div className="mt-6">
        <LoginButton
          label="Sign in with X"
          onAuthed={async (info) => {
            if (info.username) {
              setUsername(info.username);
              await refreshBalance(info.username);
            }
            if (info.walletAddress) setToAddress(info.walletAddress);
            // resolve userId via balance/sync response is optional; username path works
            setUserId(null);
          }}
        />
      </div>

      <div className="mt-8">
        <BalanceCard
          title="Earned balance"
          balance={balance}
          highlight="withdrawable"
        />
      </div>

      <form onSubmit={onWithdraw} className="card mt-6 space-y-4 p-5">
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Destination Solana wallet</span>
          <input
            className="input font-mono"
            placeholder="Your Solana address"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            required
            minLength={32}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-muted">Amount ($ansem)</span>
          <input
            className="input font-mono"
            type="number"
            min={0.01}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            required
          />
        </label>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Sending…" : "Withdraw"}
        </button>

        {status && <p className="break-all text-sm text-muted">{status}</p>}
      </form>
    </div>
  );
}
