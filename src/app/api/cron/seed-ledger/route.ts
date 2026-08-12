import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One-shot: seed real trial ledger from local SQLite (not demo 420.69).
 * Protected by CRON_SECRET. DELETE after production seed.
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  const secret = (config.cronSecret || "").trim();
  if (!secret || token !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const tipperId = "cmsq37hu90000xkg502omq1ka";
  const recipientId = "user_noicedotso";
  const tipAmount = 0.01;
  const deposit = 1.99;
  const wdSig =
    "2NBQYqE3wbkTkcAqsqFCya7t7sipawFj6Nc6xT361zdNLUGDhG7FiWjDVQv47g3YXhu3Sa6RTXkVLk1wSRfHkVvU";

  const tipper = await prisma.user.upsert({
    where: { id: tipperId },
    create: {
      id: tipperId,
      xId: "3324607607",
      username: "heettike",
      role: "tipper",
      walletAddress: "BCgCY7zrEfUoKzfwwLJBaPmDC54ted7wqJa8U48HU61L",
      privyDid: "did:privy:cmsq37gff00ye0cjrb51ovvjx",
    },
    update: {
      xId: "3324607607",
      username: "heettike",
      role: "tipper",
      walletAddress: "BCgCY7zrEfUoKzfwwLJBaPmDC54ted7wqJa8U48HU61L",
      privyDid: "did:privy:cmsq37gff00ye0cjrb51ovvjx",
    },
  });

  const recipient = await prisma.user.upsert({
    where: { id: recipientId },
    create: {
      id: recipientId,
      xId: "1920620889969684480",
      username: "noicedotso",
      role: "recipient",
      walletAddress: "y4yqr5KPy3cPTw5JYwSxoGpT3pzv2jBhezsh1JdDtdd",
      privyDid: "did:privy:cmsq3q3xu00rh0ckzjhbetj54",
    },
    update: {
      xId: "1920620889969684480",
      username: "noicedotso",
      role: "recipient",
      walletAddress: "y4yqr5KPy3cPTw5JYwSxoGpT3pzv2jBhezsh1JdDtdd",
      privyDid: "did:privy:cmsq3q3xu00rh0ckzjhbetj54",
    },
  });

  await prisma.balance.upsert({
    where: { userId: tipper.id },
    create: {
      id: "cmsq37hua0002xkg5u77ed83c",
      userId: tipper.id,
      deposited: deposit,
      withdrawable: 0,
      lifetimeSent: tipAmount,
      lifetimeReceived: 0,
    },
    update: {
      deposited: deposit,
      withdrawable: 0,
      lifetimeSent: tipAmount,
      lifetimeReceived: 0,
    },
  });

  await prisma.balance.upsert({
    where: { userId: recipient.id },
    create: {
      id: "bal_noicedotso",
      userId: recipient.id,
      deposited: 0,
      withdrawable: 0,
      lifetimeSent: 0,
      lifetimeReceived: tipAmount,
    },
    update: {
      deposited: 0,
      withdrawable: 0,
      lifetimeSent: 0,
      lifetimeReceived: tipAmount,
    },
  });

  await prisma.tipSettings.upsert({
    where: { userId: tipper.id },
    create: {
      id: "cmsq37hua0001xkg5z6wn3a3r",
      userId: tipper.id,
      likeAmount: 0.01,
      commentAmount: 0.01,
      followAmount: 0.01,
      quoteAmount: 0.01,
      superTipAmount: 1.0,
      enabled: true,
    },
    update: {
      likeAmount: 0.01,
      commentAmount: 0.01,
      followAmount: 0.01,
      quoteAmount: 0.01,
      superTipAmount: 1.0,
      enabled: true,
    },
  });

  await prisma.tip.upsert({
    where: { actionId: "like_2035565033737060483" },
    create: {
      id: "tip_like_2035565033737060483",
      actionType: "like",
      actionId: "like_2035565033737060483",
      fromUserId: tipper.id,
      toUserId: recipient.id,
      toXUsername: "noicedotso",
      toXId: "1920620889969684480",
      amount: tipAmount,
      status: "completed",
      txSig: null,
      createdAt: new Date("2026-08-12T13:03:52.000Z"),
    },
    update: {
      amount: tipAmount,
      status: "completed",
      toUserId: recipient.id,
      toXUsername: "noicedotso",
      toXId: "1920620889969684480",
    },
  });

  await prisma.withdrawal.upsert({
    where: { txSig: wdSig },
    create: {
      id: "wd_noicedotso_hist_1",
      userId: recipient.id,
      amount: tipAmount,
      toAddress: "y4yqr5KPy3cPTw5JYwSxoGpT3pzv2jBhezsh1JdDtdd",
      txSig: wdSig,
      status: "completed",
      createdAt: new Date("2026-08-12T13:28:18.000Z"),
    },
    update: {
      amount: tipAmount,
      status: "completed",
      toAddress: "y4yqr5KPy3cPTw5JYwSxoGpT3pzv2jBhezsh1JdDtdd",
    },
  });

  await prisma.processedAction.upsert({
    where: { actionId: "like_2035565033737060483" },
    create: {
      id: "pa_like_2035565033737060483",
      actionId: "like_2035565033737060483",
      actionType: "like",
      tipperXId: "3324607607",
      processedAt: new Date("2026-08-12T13:03:52.000Z"),
    },
    update: {
      actionType: "like",
      tipperXId: "3324607607",
    },
  });

  // Remove any leftover demo tipper if present
  const demo = await prisma.user.findFirst({ where: { username: "DemoTipper" } });
  if (demo) {
    await prisma.tip.deleteMany({ where: { OR: [{ fromUserId: demo.id }, { toUserId: demo.id }] } });
    await prisma.balance.deleteMany({ where: { userId: demo.id } });
    await prisma.tipSettings.deleteMany({ where: { userId: demo.id } });
    await prisma.withdrawal.deleteMany({ where: { userId: demo.id } });
    await prisma.user.delete({ where: { id: demo.id } });
  }

  const tipperBal = await prisma.balance.findUnique({ where: { userId: tipper.id } });
  const recipBal = await prisma.balance.findUnique({ where: { userId: recipient.id } });

  return NextResponse.json({
    ok: true,
    seeded: {
      tipper: tipper.username,
      recipient: recipient.username,
      tipperDeposited: tipperBal?.deposited ?? null,
      tipperLifetimeSent: tipperBal?.lifetimeSent ?? null,
      recipientWithdrawable: recipBal?.withdrawable ?? null,
      recipientLifetimeReceived: recipBal?.lifetimeReceived ?? null,
      tipActionId: "like_2035565033737060483",
      withdrawalSigPrefix: wdSig.slice(0, 12),
      demoTipperRemoved: Boolean(demo),
    },
  });
}
