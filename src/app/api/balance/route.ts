import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import {
  DEMO_TIPPER_BALANCE,
  DEMO_RECIPIENT_BALANCE,
  DEMO_TIPPER,
} from "@/lib/demo";
import { createSolanaClient } from "@/lib/solana";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/balance?username=heettike&role=tipper
 * Returns ledger balances (+ optional on-chain token balance).
 */
export async function GET(req: NextRequest) {
  const username = (
    req.nextUrl.searchParams.get("username") || ""
  )
    .replace(/^@/, "")
    .toLowerCase();
  const role = req.nextUrl.searchParams.get("role") || "tipper";
  const includeOnchain =
    req.nextUrl.searchParams.get("onchain") === "1" ||
    req.nextUrl.searchParams.get("onchain") === "true";

  try {
    if (username) {
      const user = await prisma.user.findFirst({
        where: { username },
        include: { balance: true },
      });

      if (user?.balance) {
        let onchain: number | undefined;
        if (includeOnchain && user.walletAddress) {
          const solana = createSolanaClient();
          onchain = await solana.getTokenBalance(user.walletAddress);
        }
        return NextResponse.json({
          ok: true,
          demoMode: config.demoMode,
          username: user.username,
          role: user.role,
          balance: {
            deposited: user.balance.deposited,
            withdrawable: user.balance.withdrawable,
            lifetimeSent: user.balance.lifetimeSent,
            lifetimeReceived: user.balance.lifetimeReceived,
            walletAddress: user.walletAddress,
            onchain,
          },
        });
      }
    }

    // DEMO fallbacks
    if (config.demoMode) {
      const balance =
        role === "recipient" ? DEMO_RECIPIENT_BALANCE : DEMO_TIPPER_BALANCE;
      return NextResponse.json({
        ok: true,
        demoMode: true,
        username: username || DEMO_TIPPER.username,
        role,
        balance,
      });
    }

    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
  } catch (e) {
    console.error("[balance]", e);
    // If DB not ready, still serve demo
    if (config.demoMode) {
      return NextResponse.json({
        ok: true,
        demoMode: true,
        username: username || DEMO_TIPPER.username,
        role,
        balance:
          role === "recipient" ? DEMO_RECIPIENT_BALANCE : DEMO_TIPPER_BALANCE,
        warning: "DB unavailable — demo balances",
      });
    }
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Balance failed" },
      { status: 500 }
    );
  }
}
