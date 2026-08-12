import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { watchTipperDeposits } from "@/lib/deposits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET/POST /api/cron/deposits
 * Watch allowlisted tipper Privy Solana wallets for $ansem Token-2022 deposits
 * and credit Balance.deposited for positive deltas.
 *
 * Auth: Authorization: Bearer $CRON_SECRET (or ?secret=).
 * Not on Vercel Hobby cron schedule (1/day limit) — invoke from overnight
 * agent or manually. /api/cron/poll also runs deposits in the same daily job.
 */
async function handle(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const qSecret = req.nextUrl.searchParams.get("secret");
  const token = auth?.replace(/^Bearer\s+/i, "") || qSecret || "";

  if (!config.demoMode && token !== config.cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tipper = req.nextUrl.searchParams.get("tipper");
    const deposits = await watchTipperDeposits(
      tipper ? [tipper] : undefined
    );
    return NextResponse.json({
      ok: true,
      demoMode: config.demoMode,
      mint: config.ansemMint,
      deposits,
    });
  } catch (e) {
    console.error("[cron/deposits]", e);
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Deposit watch failed",
        demoMode: config.demoMode,
      },
      { status: 500 }
    );
  }
}

export const GET = handle;
export const POST = handle;
