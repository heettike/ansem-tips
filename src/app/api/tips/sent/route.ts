import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/tips/sent?username=srijancse — that user's outbound tips. */
export async function GET(req: NextRequest) {
  const username = (req.nextUrl.searchParams.get("username") || "")
    .replace(/^@/, "")
    .toLowerCase();
  if (!username) {
    return NextResponse.json(
      { ok: false, error: "username required" },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findFirst({ where: { username } });
    if (!user) {
      return NextResponse.json({ ok: true, tips: [] });
    }

    const tips = await prisma.tip.findMany({
      where: { fromUserId: user.id },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    return NextResponse.json({
      ok: true,
      tips: tips.map((t) => ({
        id: t.id,
        actionType: t.actionType,
        actionId: t.actionId,
        toXUsername: t.toXUsername,
        amount: t.amount,
        status: t.status,
        txSig: t.txSig,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error("[tips/sent]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
