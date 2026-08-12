import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { pollAndEnqueueTips, processPendingTips } from "@/lib/tips";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET/POST /api/cron/poll
 * Poll tipper likes/replies/QTs/follows → enqueue tips → process pending.
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
    const tipper =
      req.nextUrl.searchParams.get("tipper") || config.tipperAllowlist[0];
    const poll = await pollAndEnqueueTips(tipper);
    const processed = await processPendingTips();

    return NextResponse.json({
      ok: true,
      demoMode: config.demoMode,
      tipper,
      poll,
      processed,
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
