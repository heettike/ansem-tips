import { NextRequest, NextResponse } from "next/server";
import { processTip, processPendingTips } from "@/lib/tips";
import { config } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/tips/process
 * Body: { tipId?: string } — process one or all pending tips.
 * Credits recipient ledger / records tip debit.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { tipId?: string };

    if (body.tipId) {
      const result = await processTip(body.tipId);
      return NextResponse.json({ ok: true, demoMode: config.demoMode, result });
    }

    const results = await processPendingTips();
    return NextResponse.json({
      ok: true,
      demoMode: config.demoMode,
      results,
    });
  } catch (e) {
    console.error("[tips/process]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Process failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const results = await processPendingTips();
  return NextResponse.json({ ok: true, demoMode: config.demoMode, results });
}
