import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/stats — public landing stats. No auth. */
export async function GET() {
  try {
    const [creators, completed, byCreator] = await Promise.all([
      prisma.user.count({ where: { role: "tipper" } }),
      prisma.tip.aggregate({
        where: { status: "completed" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.tip.groupBy({
        by: ["fromUserId"],
        where: { status: "completed" },
        _sum: { amount: true },
      }),
    ]);

    const fromUsers = byCreator.length
      ? await prisma.user.findMany({
          where: { id: { in: byCreator.map((g) => g.fromUserId) } },
          select: { id: true, username: true },
        })
      : [];
    const usernameById = new Map(fromUsers.map((u) => [u.id, u.username]));

    return NextResponse.json({
      ok: true,
      creators,
      totalTipped: completed._sum.amount ?? 0,
      totalTips: completed._count,
      perCreator: byCreator
        .map((g) => ({
          username: usernameById.get(g.fromUserId) || "unknown",
          total: g._sum.amount ?? 0,
        }))
        .sort((a, b) => b.total - a.total),
    });
  } catch (e) {
    console.error("[stats]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
