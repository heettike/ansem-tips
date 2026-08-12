import Link from "next/link";
import { LiveTipSettingsForm } from "@/components/LiveTipSettingsForm";
import { LoginButton } from "@/components/LoginButton";
import { config, isAllowlistedTipper } from "@/lib/config";
import { DEMO_SETTINGS } from "@/lib/demo";
import { prisma } from "@/lib/db";
import { explorerTokenUrl } from "@/lib/solana";

export const dynamic = "force-dynamic";

export default async function OnboardPage() {
  const tipper = config.tipperAllowlist[0] || "heettike";
  const allowed = isAllowlistedTipper(tipper);
  const user = await prisma.user.findFirst({
    where: { username: tipper },
    include: { tipSettings: true, balance: true },
  });
  const wallet =
    user?.walletAddress ||
    "Log in with X — Privy will show your Solana deposit address";
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
      <p className="badge badge-bull">Tipper onboarding</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tighter sm:text-5xl">
        Connect X → deposit → tip
      </h1>
      <p className="mt-3 text-muted">
        Trial allowlist: <strong className="text-foreground">@{tipper}</strong>.
        Prod later: @{config.prodTipperFuture}. Herd starts here.
      </p>

      {!allowed && (
        <div className="mt-6 border border-danger/40 bg-danger/10 p-4 text-sm">
          You are not on the tipper allowlist.
        </div>
      )}

      <ol className="mt-8 space-y-4">
        <li className="card p-5">
          <p className="text-xs uppercase tracking-wide text-muted">Step 1</p>
          <h2 className="mt-1 font-semibold">X OAuth via Privy</h2>
          <p className="mt-2 text-sm text-muted">
            Sign in with X once via Privy. OAuth tokens are stored server-side
            for liked_tweets polling — never paste X tokens. Privy creates your
            Solana deposit wallet.
          </p>
          <div className="mt-4">
            <LoginButton label="Continue with X" />
          </div>
        </li>

        <li className="card p-5">
          <p className="text-xs uppercase tracking-wide text-muted">Step 2</p>
          <h2 className="mt-1 font-semibold">
            Deposit min ${config.minDepositUsd} $ansem
          </h2>
          <p className="mt-2 text-sm text-muted">
            Send SPL $ansem to <strong>your</strong> Privy wallet below. Ledger
            deposited:{" "}
            <span className="font-mono text-foreground">
              ${user?.balance?.deposited?.toFixed?.(2) ?? "0.00"}
            </span>
          </p>
          <a
            href={explorerTokenUrl(config.ansemMint)}
            className="mt-2 block break-all font-mono text-xs text-accent hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            mint {config.ansemMint}
          </a>
          <div className="mt-4 border border-dashed border-card-border bg-black/30 p-3 font-mono text-xs break-all">
            Deposit address: {wallet}
          </div>
        </li>

        <li>
          <p className="mb-2 text-xs uppercase tracking-wide text-muted">
            Step 3
          </p>
          <LiveTipSettingsForm initial={initial} minTip={config.minTipUsd} />
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
