import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { config, isAllowlistedTipper } from "@/lib/config";
import { bearerFromRequest, createPrivyClient } from "@/lib/privy";
import { saveTipSettings } from "@/lib/tips";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  likeAmount: z.number().positive(),
  commentAmount: z.number().positive(),
  followAmount: z.number().positive(),
  quoteAmount: z.number().positive(),
  superTipAmount: z.number().positive(),
  enabled: z.boolean(),
});

async function resolveTipper(req: NextRequest) {
  const token = bearerFromRequest(req);
  if (!token) return null;
  const privy = createPrivyClient();
  const claims = await privy.verifyAuthToken(token);
  if (!claims) return null;
  const tw = await privy.getUserTwitter?.(claims.userId);
  const username = (
    tw?.username ||
    (claims.userId.includes("demo-")
      ? claims.userId.replace("did:privy:demo-", "")
      : "")
  )
    .replace(/^@/, "")
    .toLowerCase();
  if (!username || !isAllowlistedTipper(username)) return null;
  const user = await prisma.user.findFirst({
    where: { OR: [{ privyDid: claims.userId }, { username }] },
    include: { tipSettings: true },
  });
  return user;
}

/** GET current tip settings for authenticated tipper */
export async function GET(req: NextRequest) {
  try {
    const user = await resolveTipper(req);
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized tipper" }, { status: 401 });
    }
    return NextResponse.json({
      ok: true,
      settings: user.tipSettings || {
        likeAmount: 1,
        commentAmount: 1,
        followAmount: 1,
        quoteAmount: 1,
        superTipAmount: 5,
        enabled: true,
      },
      minTip: config.minTipUsd,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}

/** POST save tip settings */
export async function POST(req: NextRequest) {
  try {
    const user = await resolveTipper(req);
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized tipper" }, { status: 401 });
    }
    const parsed = settingsSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const settings = await saveTipSettings(user.id, parsed.data);
    return NextResponse.json({ ok: true, settings });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Save failed" },
      { status: 500 }
    );
  }
}
