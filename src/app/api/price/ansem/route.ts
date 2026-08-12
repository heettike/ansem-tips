import { NextResponse } from "next/server";
import { config } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/price/ansem
 * Live USD price from DexScreener for the $ansem mint (best-effort).
 * Ledger amounts remain USD-notional ($1 ledger unit ≈ $1 tip notional).
 */
export async function GET() {
  const mint = config.ansemMint;
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${mint}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) {
      return NextResponse.json({
        ok: true,
        mint,
        priceUsd: null,
        source: "dexscreener",
        error: `DexScreener HTTP ${res.status}`,
      });
    }
    const data = (await res.json()) as {
      pairs?: Array<{
        priceUsd?: string;
        liquidity?: { usd?: number };
        dexId?: string;
      }>;
    };
    const pairs = data.pairs || [];
    const best = [...pairs].sort(
      (a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0)
    )[0];
    const priceUsd = best?.priceUsd ? Number(best.priceUsd) : null;
    return NextResponse.json({
      ok: true,
      mint,
      priceUsd: Number.isFinite(priceUsd as number) ? priceUsd : null,
      dexId: best?.dexId ?? null,
      source: "dexscreener",
      note: "Ledger tip/withdraw amounts are USD-notional $ansem (1 unit = $1 notional).",
    });
  } catch (e) {
    return NextResponse.json({
      ok: true,
      mint,
      priceUsd: null,
      source: "dexscreener",
      error: e instanceof Error ? e.message : "Price fetch failed",
    });
  }
}
