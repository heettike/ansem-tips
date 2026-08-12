/**
 * Export real ledger from local SQLite and seed production Neon.
 *
 * Preferred (no DATABASE_URL needed):
 *   SEED_URL=https://ansem-tips.vercel.app/api/admin/seed-ledger \
 *   CRON_SECRET=... \
 *   npx tsx scripts/seed-prod-from-local.ts
 *
 * Or with DATABASE_URL from Neon dashboard:
 *   DATABASE_URL='postgresql://...' npx tsx scripts/seed-prod-from-local.ts --direct
 */
import { execFileSync } from "node:child_process";
import path from "node:path";

const DB = path.join(process.cwd(), "prisma", "dev.db");

function q(sql: string): any[] {
  const out = execFileSync("sqlite3", ["-json", DB, sql], { encoding: "utf8" }).trim();
  if (!out) return [];
  return JSON.parse(out);
}

function payloadFromSqlite() {
  const users = q("SELECT * FROM User;");
  const balances = q("SELECT * FROM Balance;");
  const tipSettings = q("SELECT * FROM TipSettings;").map((s) => ({
    ...s,
    enabled: Boolean(s.enabled),
  }));
  const tips = q("SELECT * FROM Tip;");
  const withdrawals = q("SELECT * FROM Withdrawal;");
  const processedActions = q("SELECT * FROM ProcessedAction;");
  return { users, balances, tipSettings, tips, withdrawals, processedActions };
}

async function seedViaApi(payload: ReturnType<typeof payloadFromSqlite>) {
  const url = process.env.SEED_URL || "https://ansem-tips.vercel.app/api/admin/seed-ledger";
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("CRON_SECRET required for API seed");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 500) };
  }
  if (!res.ok) {
    console.error("Seed API failed", res.status, json);
    process.exit(1);
  }
  console.log(JSON.stringify(json, null, 2));
}

async function seedDirect(payload: ReturnType<typeof payloadFromSqlite>) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL required for --direct");
  }
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    for (const u of payload.users) {
      await prisma.user.upsert({
        where: { id: u.id },
        create: {
          id: u.id,
          xId: u.xId,
          username: String(u.username).replace(/^@/, "").toLowerCase(),
          privyDid: u.privyDid || null,
          walletAddress: u.walletAddress || null,
          role: u.role,
        },
        update: {
          xId: u.xId,
          username: String(u.username).replace(/^@/, "").toLowerCase(),
          privyDid: u.privyDid || null,
          walletAddress: u.walletAddress || null,
          role: u.role,
        },
      });
    }
    for (const b of payload.balances) {
      await prisma.balance.upsert({
        where: { userId: b.userId },
        create: {
          id: b.id,
          userId: b.userId,
          deposited: b.deposited,
          withdrawable: b.withdrawable,
          lifetimeSent: b.lifetimeSent,
          lifetimeReceived: b.lifetimeReceived,
        },
        update: {
          deposited: b.deposited,
          withdrawable: b.withdrawable,
          lifetimeSent: b.lifetimeSent,
          lifetimeReceived: b.lifetimeReceived,
        },
      });
    }
    for (const s of payload.tipSettings) {
      await prisma.tipSettings.upsert({
        where: { userId: s.userId },
        create: {
          id: s.id,
          userId: s.userId,
          likeAmount: s.likeAmount,
          commentAmount: s.commentAmount,
          followAmount: s.followAmount,
          quoteAmount: s.quoteAmount,
          superTipAmount: s.superTipAmount,
          enabled: Boolean(s.enabled),
        },
        update: {
          likeAmount: s.likeAmount,
          commentAmount: s.commentAmount,
          followAmount: s.followAmount,
          quoteAmount: s.quoteAmount,
          superTipAmount: s.superTipAmount,
          enabled: Boolean(s.enabled),
        },
      });
    }
    for (const t of payload.tips) {
      await prisma.tip.upsert({
        where: { actionId: t.actionId },
        create: {
          id: t.id,
          actionType: t.actionType,
          actionId: t.actionId,
          fromUserId: t.fromUserId,
          toUserId: t.toUserId || null,
          toXUsername: t.toXUsername,
          toXId: t.toXId || null,
          amount: t.amount,
          txSig: t.txSig || null,
          status: t.status,
          metadata: t.metadata || null,
        },
        update: {
          toUserId: t.toUserId || null,
          amount: t.amount,
          status: t.status,
          txSig: t.txSig || null,
        },
      });
    }
    for (const w of payload.withdrawals) {
      await prisma.withdrawal.upsert({
        where: { txSig: w.txSig },
        create: {
          id: w.id,
          userId: w.userId,
          amount: w.amount,
          toAddress: w.toAddress,
          txSig: w.txSig,
          status: w.status,
        },
        update: {
          amount: w.amount,
          toAddress: w.toAddress,
          status: w.status,
        },
      });
    }
    for (const p of payload.processedActions) {
      await prisma.processedAction.upsert({
        where: { actionId: p.actionId },
        create: {
          id: p.id,
          actionId: p.actionId,
          actionType: p.actionType,
          tipperXId: p.tipperXId,
        },
        update: {
          actionType: p.actionType,
          tipperXId: p.tipperXId,
        },
      });
    }
    const tipper = await prisma.user.findFirst({
      where: { username: "heettike" },
      include: { balance: true },
    });
    console.log(
      JSON.stringify(
        {
          ok: true,
          heettikeDeposited: tipper?.balance?.deposited ?? null,
          heettikeLifetimeSent: tipper?.balance?.lifetimeSent ?? null,
        },
        null,
        2
      )
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const payload = payloadFromSqlite();
  console.log(
    "Loaded local ledger:",
    Object.fromEntries(
      Object.entries(payload).map(([k, v]) => [k, Array.isArray(v) ? v.length : 0])
    )
  );
  if (process.argv.includes("--direct")) {
    await seedDirect(payload);
  } else {
    await seedViaApi(payload);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
