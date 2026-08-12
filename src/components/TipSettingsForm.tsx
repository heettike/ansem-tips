"use client";

import { useState } from "react";
import type { TipAmountSettings } from "@/types";

const fields: { key: keyof TipAmountSettings; label: string; hint: string }[] = [
  { key: "likeAmount", label: "Like", hint: "per like" },
  { key: "commentAmount", label: "Comment", hint: "per reply" },
  { key: "followAmount", label: "Follow", hint: "per follow" },
  { key: "quoteAmount", label: "Quote tweet", hint: "per QT" },
  { key: "superTipAmount", label: "Super-tip 🐂", hint: "when 🐂 in comment/QT" },
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
        setError("Log in with X first, then save tip amounts.");
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
          typeof data.error === "string" ? data.error : "Failed to save settings"
        );
        return;
      }
      setSettings(data.settings);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSave} className="card space-y-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Tip amounts</h3>
          <p className="text-sm text-muted">Min ${minTip} $ansem per action</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => update("enabled", e.target.checked)}
            className="size-4 accent-[#b6ff3b]"
          />
          Enabled
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className="block text-sm">
            <span className="mb-1 block text-muted">
              {f.label}{" "}
              <span className="text-xs opacity-70">({f.hint})</span>
            </span>
            <input
              className="input font-mono"
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

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={loading}>
        {loading ? "Saving…" : "Save settings"}
      </button>
      {saved && <p className="text-sm text-bull">Saved to tipper settings.</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
