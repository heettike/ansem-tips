import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import {
  clawbackRetroTips,
  expireStaleClaims,
  pollAndEnqueueTips,
  processPendingTips,
} from "@/lib/tips";
import { watchTipperDeposits } from "@/lib/deposits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET/POST /api/cron/poll
 * 1) Credit tipper wallet deposits (SPL $ansem deltas)
 * 2) Poll tipper likes/replies/QTs/follows with stored user OAuth tokens
 * 3) Process pending tips
 *
 * Vercel Hobby: one cron/day — deposits run here so we don't need a second cron.
 * Auth via Authorization: Bearer $CRON_SECRET (or ?secret=).
 */
async function handle(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const qSecret = req.nextUrl.searchParams.get("secret");
  const token = auth?.replace(/^Bearer\s+/i, "") || qSecret || "";

  if (!config.demoMode && token !== config.cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tipperParam = req.nextUrl.searchParams.get("tipper");
    const tippers = tipperParam
      ? [tipperParam.replace(/^@/, "").toLowerCase()]
      : config.tipperAllowlist;

    const clawback = await clawbackRetroTips();

    const deposits = await watchTipperDeposits(tippers);

    const polls = [];
    for (const tipper of tippers) {
      try {
        polls.push({ tipper, ...(await pollAndEnqueueTips(tipper)) });
      } catch (e) {
        polls.push({
          tipper,
          error: e instanceof Error ? e.message : "poll failed",
        });
      }
    }

    const processed = await processPendingTips();

    // Return unclaimed tips to tippers after CLAIM_EXPIRY_DAYS (same daily cron).
    const claims = await expireStaleClaims();

    return NextResponse.json({
      ok: true,
      demoMode: config.demoMode,
      tippers,
      clawback,
      deposits,
      polls,
      processed,
      claims,
    });
  } catch (e) {
    console.error("[cron/poll]", e);
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Poll failed",
        demoMode: config.demoMode,
      },
      { status: 500 }
    );
  }
}

export const GET = handle;
export const POST = handle;
