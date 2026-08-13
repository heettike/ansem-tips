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
    dbError = e instanceof Error ? e.message : "db unavailable";
    fromDb = false;
  }

  const statusLine = dbError
    ? "can't load balances right now. try again in a minute."
    : fromDb && tips.length === 0 && balance.deposited === 0
      ? "nothing here yet. deposit $ansem and start liking."
      : fromDb
        ? "live balances — real numbers only"
        : "connecting…";

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-sm text-muted">tipper</p>
          <h1 className="display mt-3 text-4xl sm:text-6xl">@{tipperName}</h1>
          <p className="mt-4 max-w-md text-muted">{statusLine}</p>
          {dbError && (
            <p className="mt-3 max-w-lg break-all text-xs text-danger">
              {dbError.slice(0, 160)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LoginButton label="sign in with x" className="btn-ghost" />
          <Link href="/onboard" className="btn-ghost">
            settings
          </Link>
          <Link href="/api/cron/poll" className="btn-primary">
            pull tips
          </Link>
        </div>
      </div>

      <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <BalanceCard title="tipper balance" balance={balance} />
        <div>
          <p className="text-sm text-muted">what&apos;s running</p>
          <ul className="mt-5 space-y-3 text-lg text-muted">
            <li>
              each like / reply / follow / qt / 🐂 sends $ansem from your
              wallet to theirs.
            </li>
            <li>same action never tips twice.</li>
            <li>empty means nothing tipped yet — not fake numbers.</li>
          </ul>
        </div>
      </div>

      <div className="mt-16">
        <TipsTable tips={tips} />
      </div>
    </div>
  );
}
