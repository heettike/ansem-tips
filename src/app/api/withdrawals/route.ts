import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { explorerTxUrl, explorerAddressUrl } from "@/lib/solana";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/withdrawals?username=noicedotso */
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
      return NextResponse.json({
        ok: true,
        withdrawals: [],
        totalWithdrawn: 0,
      });
    }

    const [withdrawals, agg] = await Promise.all([
      prisma.withdrawal.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.withdrawal.aggregate({
        where: { userId: user.id },
        _sum: { amount: true },
      }),
    ]);

    const totalWithdrawn = agg._sum.amount ?? 0;

    return NextResponse.json({
      ok: true,
      totalWithdrawn,
      withdrawals: withdrawals.map((w) => ({
        id: w.id,
        amount: w.amount,
        amountUsd: w.amount,
        toAddress: w.toAddress,
        txSig: w.txSig,
        status: w.status,
        createdAt: w.createdAt.toISOString(),
        solscanUrl: explorerTxUrl(w.txSig),
        addressUrl: explorerAddressUrl(w.toAddress),
      })),
    });
  } catch (e) {
    console.error("[withdrawals]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
