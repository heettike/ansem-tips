import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import {
  clawbackRetroTips,
  expireStaleClaims,
  pollAndEnqueueTips,
  processPendingTips,
} from "@/lib/tips";
import { watchTipperDeposits } from "@/lib/deposits";
import { prisma } from "@/lib/db";

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
    // Waitlist: poll env allowlist + manually approved tippers from the DB.
    const approved = tipperParam
      ? []
      : await prisma.user.findMany({
          where: { role: "tipper", accessStatus: "approved" },
          select: { username: true, lastPolledAt: true },
        });
    const tippers = tipperParam
      ? [tipperParam.replace(/^@/, "").toLowerCase()]
      : [
          ...new Set([
            ...config.tipperAllowlist,
            ...approved.map((u) => u.username),
          ]),
        ];
    // X-poll throttle: skip tippers polled within POLL_INTERVAL_SECONDS
    // (the 1-min external cron still processes pending tips + deposits every run).
    const cutoffMs = Date.now() - config.pollIntervalSeconds * 1000;
    const lastPolled = new Map(
      approved.map((u) => [u.username, u.lastPolledAt?.getTime() ?? 0])
    );
    const duePollers = tipperParam
      ? tippers
      : tippers.filter((t) => (lastPolled.get(t) ?? 0) < cutoffMs);

    const clawback = await clawbackRetroTips();

    const deposits = await watchTipperDeposits(tippers);

    const polls = [];
    for (const tipper of duePollers) {
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
