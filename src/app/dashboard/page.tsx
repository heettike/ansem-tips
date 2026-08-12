import Link from "next/link";
import { BalanceCard } from "@/components/BalanceCard";
import { TipsTable } from "@/components/TipsTable";
import { LoginButton } from "@/components/LoginButton";
import { config } from "@/lib/config";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const EMPTY_BALANCE = {
  deposited: 0,
  withdrawable: 0,
  lifetimeSent: 0,
  lifetimeReceived: 0,
  walletAddress: null as string | null,
};

export default async function DashboardPage() {
  const tipperName = config.tipperAllowlist[0] || "heettike";

  let balance = EMPTY_BALANCE;
  let tips: Array<{
    id: string;
    actionType: string;
    actionId?: string;
    toXUsername: string;
    amount: number;
    status: string;
    txSig?: string | null;
    createdAt: string;
  }> = [];
  let fromDb = false;
  let dbError: string | null = null;

  try {
    const user = await prisma.user.findFirst({
      where: { username: tipperName },
      include: {
        balance: true,
        tipsSent: {
          orderBy: { createdAt: "desc" },
          take: 25,
        },
      },
    });
    fromDb = true;
    if (user?.balance) {
      balance = {
        deposited: user.balance.deposited,
        withdrawable: user.balance.withdrawable,
        lifetimeSent: user.balance.lifetimeSent,
        lifetimeReceived: user.balance.lifetimeReceived,
        walletAddress: user.walletAddress,
      };
    } else if (user) {
      balance = {
        ...EMPTY_BALANCE,
        walletAddress: user.walletAddress,
      };
    }
    if (user) {
      tips = user.tipsSent.map((t) => ({
        id: t.id,
        actionType: t.actionType,
        actionId: t.actionId,
        toXUsername: t.toXUsername,
        amount: t.amount,
        status: t.status,
        txSig: t.txSig,
        createdAt: t.createdAt.toISOString(),
      }));
    }
  } catch (e) {
    dbError = e instanceof Error ? e.message : "DB unavailable";
    fromDb = false;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="badge">Tipper dashboard</p>
          <h1 className="display-title mt-2 text-3xl">@{tipperName}</h1>
          <p className="mt-1 text-sm text-muted">
            {dbError
              ? `Ledger unavailable — ${dbError.slice(0, 120)}`
              : fromDb && tips.length === 0 && balance.deposited === 0
                ? "Real ledger (empty). Deposit + run poll to see tips."
                : fromDb
                  ? "Live ledger — real balances only"
                  : "Connecting to ledger…"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LoginButton label="Sign in with X" className="btn-ghost" />
          <Link href="/onboard" className="btn-ghost">
            Settings / deposit
          </Link>
          <Link href="/api/cron/poll" className="btn-primary">
            Run poll
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <BalanceCard title="Tipper balance" balance={balance} />
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold">Pipeline</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>• Cron polls likes, replies, quote-tweets, and follows.</li>
            <li>• Each action_id is processed once (deduped forever).</li>
            <li>• 🐂 in a comment or QT upgrades to super-tip.</li>
            <li>• Ledger debit → recipient credit → real SPL on withdraw.</li>
            <li>• No demo balances — empty means nothing on-chain/ledger yet.</li>
          </ul>
          <p className="mt-4 text-xs text-muted">
            Poll: <code className="text-accent">GET /api/cron/poll</code> with{" "}
            <code className="text-accent">Authorization: Bearer $CRON_SECRET</code>
          </p>
        </div>
      </div>

      <div className="mt-6">
        <TipsTable tips={tips} />
      </div>
    </div>
  );
}
