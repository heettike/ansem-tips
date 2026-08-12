import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One-shot: seed real trial ledger (not demo). Protected by CRON_SECRET.
 * Remove this route after production seed.
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  const secret = (config.cronSecret || "").trim();
  if (!secret || token !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const tipper = await prisma.user.upsert({
    where: { xId: "heettike_x" },
    create: {
      id: "cmsq37hu90000xkg502omq1ka",
      xId: "heettike_x",
      username: "heettike",
      role: "tipper",
      walletAddress: "BCgCY7zrEfUoKzfwwLJBaPmDC54ted7wqJa8U48HU61L",
      privyDid: "did:privy:cmsq37gff00ye0cjrb51ovvjx",
    },
    update: {
      username: "heettike",
      role: "tipper",
      walletAddress: "BCgCY7zrEfUoKzfwwLJBaPmDC54ted7wqJa8U48HU61L",
    },
  });

  const recipient = await prisma.user.upsert({
    where: { xId: "noicedotso_x" },
    create: {
      id: "user_noicedotso",
      xId: "noicedotso_x",
      username: "noicedotso",
      role: "recipient",
    },
    update: { username: "noicedotso", role: "recipient" },
  });

  await prisma.balance.upsert({
    where: { userId: tipper.id },
    create: {
      userId: tipper.id,
      deposited: 1.99,
      withdrawable: 0,
      lifetimeSent: 0.01,
      lifetimeReceived: 0,
    },
    update: {
      deposited: 1.99,
      withdrawable: 0,
      lifetimeSent: 0.01,
      lifetimeReceived: 0,
    },
  });

  await prisma.balance.upsert({
    where: { userId: recipient.id },
    create: {
      userId: recipient.id,
      deposited: 0,
      withdrawable: 0,
      lifetimeSent: 0,
      lifetimeReceived: 0.01,
    },
    update: {
      deposited: 0,
      withdrawable: 0,
      lifetimeSent: 0,
      lifetimeReceived: 0.01,
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
      amount: 0.01,
      status: "completed",
      txSig: null,
    },
    update: {
      amount: 0.01,
      status: "completed",
      toUserId: recipient.id,
      toXUsername: "noicedotso",
    },
  });

  await prisma.withdrawal.upsert({
    where: {
      txSig:
        "2NBQYqE3wbkTkcAqsqFCya7t7sipawFj6Nc6xT361zdNLUGDhG7FiWjDVQv47g3YXhu3Sa6RTXkVLk1wSRfHkVvU",
    },
    create: {
      userId: recipient.id,
      amount: 0.01,
      toAddress: "y4yqr5KPy3cPTw5JYwSxoGpT3pzv2jBhezsh1JdDtdd",
      txSig:
        "2NBQYqE3wbkTkcAqsqFCya7t7sipawFj6Nc6xT361zdNLUGDhG7FiWjDVQv47g3YXhu3Sa6RTXkVLk1wSRfHkVvU",
      status: "completed",
    },
    update: {
      amount: 0.01,
      status: "completed",
      toAddress: "y4yqr5KPy3cPTw5JYwSxoGpT3pzv2jBhezsh1JdDtdd",
    },
  });

  return NextResponse.json({
    ok: true,
    seeded: {
      tipper: tipper.username,
      recipient: recipient.username,
      tipperDeposited: 1.99,
      tip: 0.01,
      withdrawal: "2NBQYqE3wbkTkcAqsqFCya7t7sipawFj6Nc6xT361zdNLUGDhG7FiWjDVQv47g3YXhu3Sa6RTXkVLk1wSRfHkVvU",
    },
  });
}
