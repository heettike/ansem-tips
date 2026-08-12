import Link from "next/link";
import { LiveTipSettingsForm } from "@/components/LiveTipSettingsForm";
import { LoginButton } from "@/components/LoginButton";
import { config, isAllowlistedTipper } from "@/lib/config";
import { DEMO_SETTINGS } from "@/lib/demo";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OnboardPage() {
  const tipper = config.tipperAllowlist[0] || "heettike";
  const allowed = isAllowlistedTipper(tipper);
  const user = await prisma.user.findFirst({
    where: { username: tipper },
    include: { tipSettings: true, balance: true },
  });
  const hasDepositAddress = Boolean(user?.walletAddress);
  const wallet = user?.walletAddress || null;
  const deposited = user?.balance?.deposited ?? 0;
  const initial = user?.tipSettings
    ? {
        likeAmount: user.tipSettings.likeAmount,
        commentAmount: user.tipSettings.commentAmount,
        followAmount: user.tipSettings.followAmount,
        quoteAmount: user.tipSettings.quoteAmount,
        superTipAmount: user.tipSettings.superTipAmount,
        enabled: user.tipSettings.enabled,
      }
    : {
        ...DEMO_SETTINGS,
        likeAmount: config.minTipUsd,
        commentAmount: config.minTipUsd,
        followAmount: config.minTipUsd,
        quoteAmount: config.minTipUsd,
        superTipAmount: Math.max(1, config.minTipUsd),
      };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="badge badge-bull">Tipper onboard</p>
      <h1 className="stadium-banner mt-3 text-3xl sm:text-5xl">
        Sign in → deposit → tip
      </h1>
      <p className="mt-3 text-muted">
        Tippers right now:{" "}
        <strong className="text-foreground">
          {config.tipperAllowlist.map((t) => `@${t}`).join(" · ")}
        </strong>
      </p>

      {!allowed && (
        <div className="empty-state mt-6">
          <p className="empty-title">Not on the tipper list</p>
          <p className="empty-body">
            Only listed tippers can run tips right now. Ask to get added.
          </p>
        </div>
      )}

      <ol className="step-rail mt-10">
        <li className="step-rail-item">
          <div className="card p-5">
            <p className="step-num">Step 1</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight">
              Sign in with X
            </h2>
            <p className="mt-2 text-sm text-muted">
              One login. We remember your tipper account so tips can fire when
              you engage.
            </p>
            <div className="mt-4">
              <LoginButton label="Sign in with X" />
            </div>
          </div>
        </li>

        <li className="step-rail-item">
          <div className="card p-5">
            <p className="step-num">Step 2</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight">
              Send $ansem to your deposit address
            </h2>
            <p className="mt-2 text-sm text-muted">
              Send at least ${config.minDepositUsd} of $ansem here. Balance
              updates after the deposit lands.
            </p>
            <p className="mt-3 font-mono text-sm">
              Deposited:{" "}
              <span className="gold-glow">
                {deposited > 0 ? `${deposited.toFixed(2)} $ansem` : "Empty for now"}
              </span>
            </p>

            {hasDepositAddress && wallet ? (
              <div className="deposit-box mt-4">
                <span className="deposit-label">Your deposit address</span>
                {wallet}
              </div>
            ) : (
              <div className="deposit-box mt-4">
                <span className="deposit-label">Your deposit address</span>
                Empty for now — sign in with X first.
              </div>
            )}
          </div>
        </li>

        <li className="step-rail-item">
          <div>
            <p className="step-num mb-2">Step 3</p>
            <h2 className="mb-3 text-lg font-bold tracking-tight">
              Set tip amounts
            </h2>
            <LiveTipSettingsForm initial={initial} minTip={config.minTipUsd} />
          </div>
        </li>
      </ol>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/dashboard" className="btn-primary">
          Go to dashboard
        </Link>
        <Link href="/" className="btn-ghost">
          Back home
        </Link>
      </div>
    </div>
  );
}
