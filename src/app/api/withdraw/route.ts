import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { withdrawForUser } from "@/lib/tips";
import { config } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  userId: z.string().optional(),
  xUsername: z.string().optional(),
  toAddress: z.string().min(20).max(64),
  amount: z.number().positive(),
  chain: z.enum(["solana", "base", "bsc", "robinhood"]).optional(),
  tokenAddress: z.string().trim().max(64).optional(),
  tokenSymbol: z.string().trim().max(20).optional(),
  tokenDecimals: z.number().int().min(0).max(18).optional(),
});

/**
 * POST /api/withdraw
 * Send tip balance from the tip wallet to the user's personal wallet.
 */
export async function POST(req: NextRequest) {
  try {
    if (config.demoMode) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Demo mode is on — withdraws are paused. Turn demo off for real cash-outs.",
        },
        { status: 400 }
      );
    }

    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Check your wallet address and amount — something looks off.",
        },
        { status: 400 }
      );
    }

    const { toAddress, amount, userId, xUsername } = parsed.data;

    let uid = userId;
    if (!uid && xUsername) {
      const user = await prisma.user.findFirst({
        where: {
          username: xUsername.replace(/^@/, "").toLowerCase(),
        },
      });
      if (!user) {
        return NextResponse.json(
          {
            ok: false,
            error: "We couldn’t find that account. Sign in with X and try again.",
          },
          { status: 404 }
        );
      }
      uid = user.id;
    }

    if (!uid) {
      return NextResponse.json(
        {
          ok: false,
          error: "Sign in with X first, then withdraw.",
        },
        { status: 400 }
      );
    }

    const token =
      parsed.data.chain && parsed.data.tokenAddress
        ? {
            chain: parsed.data.chain,
            tokenAddress: parsed.data.tokenAddress,
            symbol: parsed.data.tokenSymbol || parsed.data.tokenAddress.slice(0, 8),
            decimals: parsed.data.tokenDecimals ?? 18,
          }
        : undefined;
    const result = await withdrawForUser(uid, toAddress, amount, token);
    if (
      !result.success &&
      result.error &&
      /insufficient|too low|balance is 0/i.test(result.error)
    ) {
      return NextResponse.json({
        ok: false,
        demoMode: false,
        result: {
          ...result,
          error:
            "Nothing to withdraw yet — your tip balance is 0 (or too low for that amount).",
        },
      });
    }

    return NextResponse.json({
      ok: result.success,
      demoMode: false,
      result,
    });
  } catch (e) {
    console.error("[withdraw]", e);
    return NextResponse.json(
      {
        ok: false,
        error:
          e instanceof Error
            ? e.message
            : "Withdraw didn’t go through. Try again in a bit.",
      },
      { status: 500 }
    );
  }
}
