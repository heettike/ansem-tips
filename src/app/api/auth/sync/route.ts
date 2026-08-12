import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { config, isAllowlistedTipper } from "@/lib/config";
import { bearerFromRequest, createPrivyClient } from "@/lib/privy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  walletAddress: z.string().optional().nullable(),
  role: z.enum(["tipper", "recipient"]).optional(),
});

/**
 * POST /api/auth/sync
 * Verify Privy access token, upsert User from X identity, attach Solana wallet.
 */
export async function POST(req: NextRequest) {
  try {
    const token = bearerFromRequest(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "Missing bearer token" }, { status: 401 });
    }

    const privy = createPrivyClient();
    const claims = await privy.verifyAuthToken(token);
    if (!claims) {
      return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 401 });
    }

    const body = bodySchema.parse(await req.json().catch(() => ({})));
    const tw = (await privy.getUserTwitter?.(claims.userId)) || {
      username: claims.userId.includes("demo-")
        ? claims.userId.replace("did:privy:demo-", "")
        : "",
      subject: claims.userId,
    };

    const username = (tw.username || "").replace(/^@/, "").toLowerCase();
    if (!username) {
      return NextResponse.json(
        { ok: false, error: "No X username linked on Privy user" },
        { status: 400 }
      );
    }

    const xId = tw.subject || `privy_${claims.userId}`;
    const wantTipper = body.role === "tipper" || isAllowlistedTipper(username);
    if (wantTipper && !isAllowlistedTipper(username)) {
      return NextResponse.json(
        {
          ok: false,
          error: `@${username} is not an allowlisted tipper`,
          allowlist: config.tipperAllowlist,
        },
        { status: 403 }
      );
    }

    const wallet =
      body.walletAddress ||
      claims.walletAddress ||
      (await privy.getSolanaWallet(claims.userId));

    const user = await prisma.user.upsert({
      where: { xId },
      create: {
        xId,
        username,
        privyDid: claims.userId,
        walletAddress: wallet || null,
        role: wantTipper ? "tipper" : "recipient",
        tipSettings: wantTipper ? { create: {} } : undefined,
        balance: { create: {} },
      },
      update: {
        username,
        privyDid: claims.userId,
        ...(wallet ? { walletAddress: wallet } : {}),
        ...(wantTipper ? { role: "tipper" } : {}),
      },
      include: { balance: true, tipSettings: true },
    });

    if (wantTipper && !user.tipSettings) {
      await prisma.tipSettings.create({ data: { userId: user.id } });
    }

    return NextResponse.json({
      ok: true,
      demoMode: config.demoMode,
      userId: user.id,
      username: user.username,
      role: user.role,
      privyDid: user.privyDid,
      walletAddress: user.walletAddress,
      balance: user.balance,
    });
  } catch (e) {
    console.error("[auth/sync]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Sync failed" },
      { status: 500 }
    );
  }
}
