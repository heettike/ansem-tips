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

  const emptyCockpit =
    fromDb && tips.length === 0 && balance.deposited === 0 && !dbError;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="badge">Tipper dashboard</p>
          <h1 className="stadium-banner mt-2 text-3xl sm:text-4xl">
            @{tipperName}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {dbError
              ? "Balances unavailable right now — try again in a bit."
              : emptyCockpit
                ? "Nothing tipped yet. Deposit $ansem, set amounts, then engage."
                : fromDb
                  ? "Live balances — what you deposited and sent."
                  : "Loading balances…"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LoginButton label="Sign in with X" className="btn-ghost" />
          <Link href="/onboard" className="btn-ghost">
            Settings / deposit
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <BalanceCard title="Tipper balance" balance={balance} />
        <div className="card p-5 lg:col-span-2">
          <p className="label-mono text-accent">How tipping works</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>• You like / reply / follow / QT → they get $ansem.</li>
            <li>• Drop 🐂 in a reply or QT → super tip.</li>
            <li>• Same action never tips twice.</li>
            <li>• People cash out from the withdraw page when they’re ready.</li>
          </ul>
        </div>
      </div>

      {emptyCockpit && (
        <div className="empty-state mt-6">
          <p className="empty-title">Quiet for now</p>
          <p className="empty-body">
            Deposit $ansem on onboard, set tip amounts, then go touch some
            tweets. Tips show up here.
          </p>
        </div>
      )}

      <div className="mt-6">
        <TipsTable tips={tips} />
      </div>
    </div>
  );
}
