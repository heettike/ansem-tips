import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { config, isAllowlistedTipper } from "@/lib/config";
import { bearerFromRequest, createPrivyClient } from "@/lib/privy";
import { createSolanaClient } from "@/lib/solana";
import { clawbackRetroTips } from "@/lib/tips";
import { mergeLoginIdentity } from "@/lib/auth-merge";

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
    // Open login: anyone gets in; tipping access is manually approved (waitlist).
    const wantTipper = body.role === "tipper" || isAllowlistedTipper(username);
    const autoApproved = isAllowlistedTipper(username);

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
    } else {
      const serverTokens = await privy.getUserTwitterOAuthTokens?.(claims.userId);
      if (serverTokens?.accessToken) {
        accessToken = serverTokens.accessToken;
        refreshToken = serverTokens.refreshToken ?? null;
        expiresAt = serverTokens.expiresAt ?? null;
      }
    }

    // Store X tokens on every login regardless of role — the poller refreshes
    // them indefinitely so users never need to log in again for tips to work.
    const tokenUpdate =
      accessToken
        ? {
            twitterAccessToken: accessToken,
            twitterRefreshToken: refreshToken ?? null,
            twitterTokenExpiresAt: expiresAt ?? null,
          }
        : {};

    const existing = await prisma.user.findUnique({
      where: { xId },
      select: { privyDid: true, walletAddress: true },
    });
    const merged = mergeLoginIdentity(
      {
        privyDid: existing?.privyDid ?? null,
        walletAddress: existing?.walletAddress ?? null,
      },
      {
        privyDid: claims.userId,
        walletAddress: wallet || null,
      }
    );

    const user = await prisma.user.upsert({
      where: { xId },
      create: {
        xId,
        username,
        privyDid: merged.privyDid,
        walletAddress: merged.walletAddress,
        role: wantTipper ? "tipper" : "recipient",
        accessStatus: autoApproved ? "approved" : "pending",
        lastActiveAt: new Date(),
        ...tokenUpdate,
        ...(wantTipper && merged.walletAddress ? { tipsArmedAt: new Date() } : {}),
        tipSettings: wantTipper ? { create: {} } : undefined,
        balance: { create: {} },
      },
      update: {
        username,
        privyDid: merged.privyDid,
        lastActiveAt: new Date(),
        ...(autoApproved ? { accessStatus: "approved" } : {}),
        ...(merged.walletAddress ? { walletAddress: merged.walletAddress } : {}),
        ...(wantTipper ? { role: "tipper" } : {}),
        ...tokenUpdate,
      },
      include: { balance: true, tipSettings: true },
    });

    if (wantTipper && !user.tipSettings) {
      await prisma.tipSettings.create({ data: { userId: user.id } });
    }

    // Arm tipping once: allowlisted tipper + Privy Solana wallet. Never overwrite.
    if (wantTipper) {
      const walletReady = Boolean(user.walletAddress || wallet);
      if (walletReady) {
        await prisma.user.updateMany({
          where: { id: user.id, tipsArmedAt: null, walletAddress: { not: null } },
          data: { tipsArmedAt: new Date() },
        });
      }
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

    // Reverse first-poll follow dumps on the next login, not only the daily cron.
    let clawback: Awaited<ReturnType<typeof clawbackRetroTips>> | undefined;
    if (wantTipper) {
      try {
        clawback = await clawbackRetroTips();
      } catch (e) {
        console.error("[auth/sync] clawback failed", e);
      }
    }

    return NextResponse.json({
      ok: true,
      demoMode: config.demoMode,
      userId: user.id,
      username: user.username,
      role: user.role,
      accessStatus: user.accessStatus,
      privyDid: user.privyDid,
      walletAddress: user.walletAddress,
      balance: user.balance,
      twitterOAuthStored: Boolean(accessToken || user.twitterAccessToken),
      clawback: clawback
        ? {
            reversed: clawback.reversed,
            reversedAmount: clawback.reversedAmount,
            voidedPending: clawback.voidedPending,
            reportedOnchain: clawback.reportedOnchain.length,
          }
        : undefined,
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
