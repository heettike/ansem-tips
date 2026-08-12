import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { config, isAllowlistedTipper } from "@/lib/config";
import { bearerFromRequest, createPrivyClient } from "@/lib/privy";
import { creditDeposit } from "@/lib/tips";
import { createSolanaClient, resolveHotWalletAddress } from "@/lib/solana";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  amount: z.number().positive().optional(),
  /** When true, credit from observed hot-wallet ATA delta ops path (manual amount required for v0) */
  credit: z.boolean().optional(),
});

/**
 * GET deposit instructions (hot wallet address + mint).
 * POST credit tipper deposited ledger (authenticated allowlisted tipper).
 */
export async function GET() {
  const hot = await resolveHotWalletAddress();
  return NextResponse.json({
    ok: true,
    mint: config.ansemMint,
    hotWalletAddress: hot,
    minDepositUsd: config.minDepositUsd,
    demoMode: config.demoMode,
  });
}

export async function POST(req: NextRequest) {
  try {
    const token = bearerFromRequest(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "Missing bearer" }, { status: 401 });
    }
    const privy = createPrivyClient();
    const claims = await privy.verifyAuthToken(token);
    if (!claims) {
      return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 401 });
    }
    const tw = await privy.getUserTwitter?.(claims.userId);
    const username = (
      tw?.username ||
      (claims.userId.includes("demo-")
        ? claims.userId.replace("did:privy:demo-", "")
        : "")
    )
      .replace(/^@/, "")
      .toLowerCase();
    if (!username || !isAllowlistedTipper(username)) {
      return NextResponse.json({ ok: false, error: "Not allowlisted tipper" }, { status: 403 });
    }

    const body = bodySchema.parse(await req.json().catch(() => ({})));
    const user = await prisma.user.findFirst({
      where: { OR: [{ privyDid: claims.userId }, { username }] },
    });
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Sync account via /api/auth/sync first" },
        { status: 404 }
      );
    }

    if (!body.amount || body.amount < config.minDepositUsd) {
      return NextResponse.json(
        {
          ok: false,
          error: `amount required (>= ${config.minDepositUsd})`,
          minDepositUsd: config.minDepositUsd,
        },
        { status: 400 }
      );
    }

    // Optional: verify hot wallet on-chain balance is non-zero before credit
    const hot = await resolveHotWalletAddress();
    if (hot && !config.demoMode) {
      const solana = createSolanaClient();
      const onchain = await solana.getTokenBalance(hot);
      if (onchain < body.amount) {
        return NextResponse.json(
          {
            ok: false,
            error: "Hot wallet on-chain $ansem below credit amount — send deposit first",
            onchain,
          },
          { status: 400 }
        );
      }
    }

    const deposited = await creditDeposit(user.id, body.amount);
    return NextResponse.json({
      ok: true,
      deposited,
      credited: body.amount,
      demoMode: config.demoMode,
    });
  } catch (e) {
    console.error("[deposit]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Deposit failed" },
      { status: 500 }
    );
  }
}
