"use client";

import { useState } from "react";

export function MintChip({ mint }: { mint: string }) {
  const [copied, setCopied] = useState(false);
  const short = `${mint.slice(0, 4)}…${mint.slice(-4)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(mint);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <button type="button" onClick={copy} className="chip hover:border-accent/60" title={mint}>
      <span className="text-muted">Mint</span>
      <span className="text-accent text-glow">{short}</span>
      <span className="text-muted">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
