import Link from "next/link";
import { TipSettingsForm } from "@/components/TipSettingsForm";
import { LoginButton } from "@/components/LoginButton";
import { config, isAllowlistedTipper } from "@/lib/config";
import { DEMO_SETTINGS, DEMO_TIPPER } from "@/lib/demo";
import { explorerTokenUrl, resolveHotWalletAddress } from "@/lib/solana";

export const dynamic = "force-dynamic";

export default async function OnboardPage() {
  const tipper = config.tipperAllowlist[0] || "heettike";
  const allowed = isAllowlistedTipper(tipper);
  const hotWallet = await resolveHotWalletAddress();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="badge">Tipper onboarding</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        Connect X → deposit → tip
      </h1>
      <p className="mt-3 text-muted">
        Trial allowlist: <strong className="text-foreground">@{tipper}</strong>.
        Future prod tipper: @{config.prodTipperFuture}. Structure supports up to
        100 community tippers via{" "}
        <code className="text-accent">TIPPER_ALLOWLIST</code>.
      </p>

      {!allowed && (
        <div className="mt-6 rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm">
          You are not on the tipper allowlist.
        </div>
      )}

      <ol className="mt-8 space-y-4">
        <li className="card p-5">
          <p className="text-xs uppercase tracking-wide text-muted">Step 1</p>
          <h2 className="mt-1 font-semibold">X OAuth via Privy</h2>
          <p className="mt-2 text-sm text-muted">
            Sign in with X. Privy creates an embedded Solana wallet when{" "}
            <code className="text-accent">NEXT_PUBLIC_PRIVY_APP_ID</code> is set.
          </p>
          <div className="mt-4">
            <LoginButton label="Continue with X" />
          </div>
          {config.demoMode && (
            <p className="mt-2 font-mono text-xs text-muted">
              DEMO_MODE identity: @{DEMO_TIPPER.username} · {DEMO_TIPPER.privyDid}
            </p>
          )}
        </li>

        <li className="card p-5">
          <p className="text-xs uppercase tracking-wide text-muted">Step 2</p>
          <h2 className="mt-1 font-semibold">
            Deposit min ${config.minDepositUsd} $ansem
          </h2>
          <p className="mt-2 text-sm text-muted">
            Send SPL $ansem to the custody hot wallet. Tips debit your deposited
            ledger. Mint:
          </p>
          <a
            href={explorerTokenUrl(config.ansemMint)}
            className="mt-2 block break-all font-mono text-xs text-accent hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            {config.ansemMint}
          </a>
          <div className="mt-4 rounded-lg border border-dashed border-card-border bg-black/30 p-3 font-mono text-xs text-muted">
            Deposit address:{" "}
            {hotWallet ||
              DEMO_TIPPER.walletAddress +
                " (set HOT_WALLET_SECRET / HOT_WALLET_ADDRESS)"}
          </div>
        </li>

        <li>
          <p className="mb-2 text-xs uppercase tracking-wide text-muted">
            Step 3
          </p>
          <TipSettingsForm initial={DEMO_SETTINGS} minTip={config.minTipUsd} />
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
