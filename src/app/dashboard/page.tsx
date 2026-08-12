import Link from "next/link";
import { BalanceCard } from "@/components/BalanceCard";
import { TipsTable } from "@/components/TipsTable";
import { LoginButton } from "@/components/LoginButton";
import { config } from "@/lib/config";
import { DEMO_RECENT_TIPS, DEMO_TIPPER_BALANCE } from "@/lib/demo";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const tipperName = config.tipperAllowlist[0] || "heettike";

  let balance = DEMO_TIPPER_BALANCE;
  let tips: Array<{
    id: string;
    actionType: string;
    actionId?: string;
    toXUsername: string;
    amount: number;
    status: string;
    txSig?: string | null;
    createdAt: string;
  }> = DEMO_RECENT_TIPS;
  let fromDb = false;

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
    if (user?.balance) {
      fromDb = true;
      balance = {
        deposited: user.balance.deposited,
        withdrawable: user.balance.withdrawable,
        lifetimeSent: user.balance.lifetimeSent,
        lifetimeReceived: user.balance.lifetimeReceived,
        walletAddress: user.walletAddress,
      };
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
  } catch {
    // DB not ready — demo cards
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="badge">Tipper dashboard</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            @{tipperName}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {fromDb
              ? "Live ledger balances"
              : config.demoMode
                ? "DEMO_MODE / empty DB — mock balance & tips"
                : "No tipper row yet — run poll after deposit"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LoginButton label="Sign in with X" className="btn-ghost" />
          <Link href="/onboard" className="btn-ghost">
            Settings / deposit
          </Link>
          <Link
            href="/api/cron/poll"
            className="btn-primary"
          >
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
            <li>• Ledger debit → recipient credit → SPL on withdraw (or immediate if wallet linked).</li>
            <li>• Low balance → X bot stub ping + server log alert.</li>
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
