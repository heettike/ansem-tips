/**
 * Seed the historical real withdraw for noicedotso so history isn't empty.
 * Idempotent on txSig.
 *
 *   npx tsx scripts/seed-withdrawal.ts
 */
import { PrismaClient } from "@prisma/client";

const TX_SIG =
  "2NBQYqE3wbkTkcAqsqFCya7t7sipawFj6Nc6xT361zdNLUGDhG7FiWjDVQv47g3YXhu3Sa6RTXkVLk1wSRfHkVvU";
const TO =
  "y4yqr5KPy3cPTw5JYwSxoGpT3pzv2jBhezsh1JdDtdd";
const AMOUNT = 0.01;
const USERNAME = "noicedotso";
const USER_ID = "user_noicedotso";

async function main() {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.upsert({
      where: { id: USER_ID },
      create: {
        id: USER_ID,
        xId: "1920620889969684480",
        username: USERNAME,
        role: "recipient",
        walletAddress: TO,
        balance: {
          create: {
            id: "bal_noicedotso",
            deposited: 0,
            withdrawable: 0,
            lifetimeSent: 0,
            lifetimeReceived: 0.01,
          },
        },
      },
      update: {
        username: USERNAME,
        walletAddress: TO,
      },
      include: { balance: true },
    });

    // Ensure lifetimeReceived reflects the tip if somehow zero
    if (user.balance && user.balance.lifetimeReceived < AMOUNT) {
      await prisma.balance.update({
        where: { userId: user.id },
        data: { lifetimeReceived: AMOUNT },
      });
    }

    const existing = await prisma.withdrawal.findUnique({
      where: { txSig: TX_SIG },
    });
    if (existing) {
      console.log("Withdrawal already seeded:", existing.id);
    } else {
      const row = await prisma.withdrawal.create({
        data: {
          id: "wd_noicedotso_hist_1",
          userId: user.id,
          amount: AMOUNT,
          toAddress: TO,
          txSig: TX_SIG,
          status: "completed",
          createdAt: new Date("2026-08-12T13:28:18.000Z"),
        },
      });
      console.log("Seeded withdrawal:", row.id, row.txSig);
    }

    const tip = await prisma.tip.findFirst({
      where: { toUserId: user.id },
    });
    if (!tip) {
      // Only create tip if tipper exists; otherwise skip tip seed
      const tipper = await prisma.user.findFirst({
        where: { username: "heettike" },
      });
      if (tipper) {
        await prisma.tip.create({
          data: {
            id: "tip_like_2035565033737060483",
            actionType: "like",
            actionId: "like_2035565033737060483",
            fromUserId: tipper.id,
            toUserId: user.id,
            toXUsername: USERNAME,
            toXId: "1920620889969684480",
            amount: AMOUNT,
            status: "completed",
            createdAt: new Date("2026-08-12T13:03:52.000Z"),
          },
        });
        console.log("Seeded tip for noicedotso");
      } else {
        console.log("Tipper heettike missing — tip not seeded (ok on empty box DB)");
      }
    } else {
      console.log("Tip already present:", tip.id);
    }

    const count = await prisma.withdrawal.count({ where: { userId: user.id } });
    console.log(`Withdrawals for ${USERNAME}: ${count}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
