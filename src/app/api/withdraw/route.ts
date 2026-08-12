import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { withdrawForUser } from "@/lib/tips";
import { config } from "@/lib/config";
import {
  DEMO_RECIPIENT_BALANCE,
  demoTxSig,
} from "@/lib/demo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  userId: z.string().optional(),
  xUsername: z.string().optional(),
  toAddress: z.string().min(32).max(64),
  amount: z.number().positive(),
});

/**
 * POST /api/withdraw
 * SPL transfer path from custody hot wallet → recipient personal Solana address.
 * In DEMO_MODE, simulates tx signatures.
 */
export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { toAddress, amount, userId, xUsername } = parsed.data;

    // DEMO short-circuit without DB if nothing seeded
    if (config.demoMode && !userId && !xUsername) {
      return NextResponse.json({
        ok: true,
        demoMode: true,
        result: {
          success: true,
          txSig: demoTxSig("withdraw"),
          amount,
          toAddress,
          demo: true,
          balanceAfter:
            DEMO_RECIPIENT_BALANCE.withdrawable - amount > 0
              ? DEMO_RECIPIENT_BALANCE.withdrawable - amount
              : 0,
        },
      });
    }

    let uid = userId;
    if (!uid && xUsername) {
      const user = await prisma.user.findFirst({
        where: {
          username: xUsername.replace(/^@/, "").toLowerCase(),
        },
      });
      // Case-insensitive fallback
      const user2 =
        user ||
        (await prisma.user.findFirst({
          where: { username: { equals: xUsername.replace(/^@/, "") } },
        }));
      if (!user2) {
        return NextResponse.json(
          { ok: false, error: "User not found" },
          { status: 404 }
        );
      }
      uid = user2.id;
    }

    if (!uid) {
      return NextResponse.json(
        { ok: false, error: "userId or xUsername required" },
        { status: 400 }
      );
    }

    const result = await withdrawForUser(uid, toAddress, amount);
    return NextResponse.json({
      ok: result.success,
      demoMode: config.demoMode,
      result,
    });
  } catch (e) {
    console.error("[withdraw]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Withdraw failed" },
      { status: 500 }
    );
  }
}
