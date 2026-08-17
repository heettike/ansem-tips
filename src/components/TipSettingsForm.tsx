"use client";

import { useEffect, useState } from "react";
import type { TipAmountSettings } from "@/types";

const fields: { key: keyof TipAmountSettings; label: string; hint: string }[] = [
  {
    key: "likeAmount",
    label: "like",
    hint: "this much leaves your wallet when you like",
  },
  {
    key: "commentAmount",
    label: "reply",
    hint: "this much leaves your wallet when you reply",
  },
  {
    key: "followAmount",
    label: "follow",
    hint: "this much leaves your wallet when you follow",
  },
  {
    key: "quoteAmount",
    label: "qt",
    hint: "this much leaves your wallet when you qt",
  },
  {
    key: "superTipAmount",
    label: "super tip 🐂",
    hint: "this much leaves your wallet when 🐂 is in a reply or qt",
  },
];

export function TipSettingsForm({
  initial,
  minTip = 0.01,
  authToken,
}: {
  initial: TipAmountSettings;
  minTip?: number;
  authToken?: string | null;
}) {
  const [settings, setSettings] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/tips/settings", {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        if (cancelled || !data.ok || !data.settings) return;
        setSettings({
          likeAmount: data.settings.likeAmount,
          commentAmount: data.settings.commentAmount,
          followAmount: data.settings.followAmount,
          quoteAmount: data.settings.quoteAmount,
          superTipAmount: data.settings.superTipAmount,
          commentTrigger: data.settings.commentTrigger || "lfg",
          superTipTrigger: data.settings.superTipTrigger || "🐂",
          tipChain: data.settings.tipChain || "solana",
          tipTokenAddress: data.settings.tipTokenAddress || "",
          tipTokenSymbol: data.settings.tipTokenSymbol || "ansem",
          tipTokenDecimals: data.settings.tipTokenDecimals ?? 6,
          enabled: data.settings.enabled,
        });
      } catch {
        /* keep defaults until save */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authToken]);

  function update(
    key: keyof TipAmountSettings,
    value: number | boolean | string
  ) {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!authToken) {
        setError("log in with x first, then save tip amounts.");
        return;
      }
      const res = await fetch("/api/tips/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "couldn't save. try again."
        );
        return;
      }
      setSettings(data.settings);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSave} className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">tip amounts</h3>
          <p className="mt-1 text-sm text-muted">
            this much $ansem leaves your wallet. min {minTip} $ansem.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => update("enabled", e.target.checked)}
            className="size-4 accent-[#b6ff3b]"
          />
          on
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-2 block text-sm text-muted">
              {f.label}{" "}
              <span className="opacity-70">({f.hint})</span>
            </span>
            <input
              className="input"
              type="number"
              min={minTip}
              step="0.01"
              value={settings[f.key] as number}
              onChange={(e) =>
                update(f.key, Math.max(minTip, Number(e.target.value) || minTip))
              }
            />
          </label>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm text-muted">
            reply trigger{" "}
            <span className="opacity-70">
              (replies only tip when they contain this — word or emoji)
            </span>
          </span>
          <input
            className="input"
            type="text"
            maxLength={50}
            value={settings.commentTrigger ?? "lfg"}
            onChange={(e) => update("commentTrigger", e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-muted">
            super tip trigger{" "}
            <span className="opacity-70">
              (replies or qts with this pay the super tip)
            </span>
          </span>
          <input
            className="input"
            type="text"
            maxLength={50}
            value={settings.superTipTrigger ?? "🐂"}
            onChange={(e) => update("superTipTrigger", e.target.value)}
          />
        </label>
      </div>

      <div className="space-y-4 border-t border-[#222] pt-5">
        <p className="text-sm text-muted">
          tip token{" "}
          <span className="opacity-70">
            (default is $ansem on solana — pick any coin on any chain)
          </span>
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm text-muted">chain</span>
            <select
              className="input"
              value={settings.tipChain ?? "solana"}
              onChange={(e) => update("tipChain", e.target.value)}
            >
              <option value="solana">solana</option>
              <option value="base">base</option>
              <option value="bsc">bnb chain</option>
              <option value="robinhood">robinhood chain</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-muted">
              token address{" "}
              <span className="opacity-70">(blank = $ansem)</span>
            </span>
            <input
              className="input"
              type="text"
              maxLength={64}
              placeholder="mint or contract address"
              value={settings.tipTokenAddress ?? ""}
              onChange={(e) => update("tipTokenAddress", e.target.value.trim())}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-muted">symbol</span>
            <input
              className="input"
              type="text"
              maxLength={20}
              value={settings.tipTokenSymbol ?? "ansem"}
              onChange={(e) => update("tipTokenSymbol", e.target.value.trim())}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-muted">decimals</span>
            <input
              className="input"
              type="number"
              min={0}
              max={18}
              step="1"
              value={settings.tipTokenDecimals ?? 6}
              onChange={(e) =>
                update(
                  "tipTokenDecimals",
                  Math.max(0, Math.min(18, Number(e.target.value) || 0))
                )
              }
            />
          </label>
        </div>
      </div>

      <button
        type="submit"
        className="btn-primary"
        disabled={loading}
      >
        {loading ? "saving…" : "save amounts"}
      </button>
      {saved && <p className="text-sm mark">saved.</p>}
      {error && (
        <p className="border border-danger p-3 text-sm text-danger">{error}</p>
      )}
    </form>
  );
}
