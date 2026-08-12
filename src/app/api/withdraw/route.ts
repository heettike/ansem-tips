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
  toAddress: z.string().min(32).max(64),
  amount: z.number().positive(),
});

/**
 * POST /api/withdraw
 * Real SPL transfer from custody hot wallet → recipient personal Solana address.
 * No demo/fake success paths.
 */
export async function POST(req: NextRequest) {
  try {
    if (config.demoMode) {
      return NextResponse.json(
        { ok: false, error: "DEMO_MODE is on — disable it for real withdraws" },
        { status: 400 }
      );
    }

    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.flatten() },
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
          { ok: false, error: "User not found" },
          { status: 404 }
        );
      }
      uid = user.id;
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
      demoMode: false,
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
