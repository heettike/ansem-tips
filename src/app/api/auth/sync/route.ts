import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { config, isAllowlistedTipper } from "@/lib/config";
import { bearerFromRequest, createPrivyClient } from "@/lib/privy";
import { createSolanaClient } from "@/lib/solana";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const oauthTokensSchema = z
  .object({
    provider: z.string().optional(),
    accessToken: z.string().min(1),
    refreshToken: z.string().optional().nullable(),
    accessTokenExpiresInSeconds: z.number().optional().nullable(),
  })
  .optional()
  .nullable();

const bodySchema = z.object({
  walletAddress: z.string().optional().nullable(),
  role: z.enum(["tipper", "recipient"]).optional(),
  /** Captured client-side via Privy useOAuthTokens — never ask tipper to paste */
  oauthTokens: oauthTokensSchema,
});

/**
 * POST /api/auth/sync
 * Verify Privy access token, upsert User from X identity, attach Solana wallet,
 * and persist Twitter OAuth tokens when Privy returns them to the client.
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

    // Prefer client-captured OAuth tokens; probe server getUser as a fallback (usually empty).
    let accessToken: string | undefined;
    let refreshToken: string | null | undefined;
    let expiresAt: Date | null | undefined;

    const clientTokens = body.oauthTokens;
    const isTwitter =
      !clientTokens?.provider ||
      clientTokens.provider === "twitter" ||
      clientTokens.provider === "twitter_oauth";

    if (clientTokens?.accessToken && isTwitter) {
      accessToken = clientTokens.accessToken;
      refreshToken = clientTokens.refreshToken ?? null;
      expiresAt =
        clientTokens.accessTokenExpiresInSeconds != null
          ? new Date(
              Date.now() + clientTokens.accessTokenExpiresInSeconds * 1000
            )
          : null;
    } else if (wantTipper) {
      const serverTokens = await privy.getUserTwitterOAuthTokens?.(claims.userId);
      if (serverTokens?.accessToken) {
        accessToken = serverTokens.accessToken;
        refreshToken = serverTokens.refreshToken ?? null;
        expiresAt = serverTokens.expiresAt ?? null;
      }
    }

    const tokenUpdate =
      wantTipper && accessToken
        ? {
            twitterAccessToken: accessToken,
            twitterRefreshToken: refreshToken ?? null,
            twitterTokenExpiresAt: expiresAt ?? null,
          }
        : {};

    const user = await prisma.user.upsert({
      where: { xId },
      create: {
        xId,
        username,
        privyDid: claims.userId,
        walletAddress: wallet || null,
        role: wantTipper ? "tipper" : "recipient",
        ...tokenUpdate,
        tipSettings: wantTipper ? { create: {} } : undefined,
        balance: { create: {} },
      },
      update: {
        username,
        privyDid: claims.userId,
        ...(wallet ? { walletAddress: wallet } : {}),
        ...(wantTipper ? { role: "tipper" } : {}),
        ...tokenUpdate,
      },
      include: { balance: true, tipSettings: true },
    });

    if (wantTipper && !user.tipSettings) {
      await prisma.tipSettings.create({ data: { userId: user.id } });
    }

    // Baseline on-chain $ansem so deposit watcher only credits post-login deltas.
    if (
      wantTipper &&
      user.walletAddress &&
      user.lastSeenTokenBalance == null &&
      !config.demoMode
    ) {
      try {
        const solana = createSolanaClient();
        const onchain = await solana.getTokenBalance(user.walletAddress);
        await prisma.user.update({
          where: { id: user.id },
          data: { lastSeenTokenBalance: onchain },
        });
      } catch (e) {
        console.error("[auth/sync] baseline token balance failed", e);
      }
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
      twitterOAuthStored: Boolean(accessToken || user.twitterAccessToken),
      // Never echo token values
    });
  } catch (e) {
    console.error("[auth/sync]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Sync failed" },
      { status: 500 }
    );
  }
}
