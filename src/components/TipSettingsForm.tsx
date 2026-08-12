"use client";

import { useState } from "react";
import type { TipAmountSettings } from "@/types";

const fields: { key: keyof TipAmountSettings; label: string; hint: string }[] = [
  { key: "likeAmount", label: "like", hint: "per like" },
  { key: "commentAmount", label: "comment", hint: "per reply" },
  { key: "followAmount", label: "follow", hint: "per follow" },
  { key: "quoteAmount", label: "quote tweet", hint: "per qt" },
  { key: "superTipAmount", label: "super tip 🐂", hint: "when 🐂 in comment/qt" },
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

  function update(key: keyof TipAmountSettings, value: number | boolean) {
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
            min ${minTip} $ansem per action
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
