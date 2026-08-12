import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function tweetIdFromActionId(actionId: string): string | null {
  // like_2035565033737060483 / comment_xxx / quote_xxx
  const m = actionId.match(/^(?:like|comment|reply|quote|follow|super_tip)_(\d+)$/i);
  return m?.[1] ?? null;
}

/** GET /api/tips/received?username=noicedotso */
export async function GET(req: NextRequest) {
  const username = (req.nextUrl.searchParams.get("username") || "")
    .replace(/^@/, "")
    .toLowerCase();
  if (!username) {
    return NextResponse.json({ ok: false, error: "username required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findFirst({ where: { username } });
    if (!user) {
      return NextResponse.json({ ok: true, tips: [] });
    }

    const tips = await prisma.tip.findMany({
      where: {
        OR: [{ toUserId: user.id }, { toXUsername: username }],
      },
      include: { fromUser: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      ok: true,
      tips: tips.map((t) => {
        const tweetId = tweetIdFromActionId(t.actionId);
        return {
          id: t.id,
          actionType: t.actionType,
          actionId: t.actionId,
          amount: t.amount,
          amountUsd: t.amount, // ledger unit = USD-notional $ansem
          status: t.status,
          txSig: t.txSig,
          createdAt: t.createdAt.toISOString(),
          fromUsername: t.fromUser?.username || "unknown",
          toXUsername: t.toXUsername,
          tweetId,
          tweetUrl: tweetId
            ? `https://x.com/i/web/status/${tweetId}`
            : null,
        };
      }),
    });
  } catch (e) {
    console.error("[tips/received]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
