import Link from "next/link";
import { DEMO_LANDING_STATS } from "@/lib/demo";
import { config } from "@/lib/config";
import { explorerAddressUrl, explorerTokenUrl } from "@/lib/solana";

export function LandingHero() {
  const stats = [
    { label: "Tips sent", value: DEMO_LANDING_STATS.tipsSent.toLocaleString() },
    {
      label: "$ansem tipped",
      value: DEMO_LANDING_STATS.ansemTipped.toLocaleString(),
    },
    { label: "Recipients", value: DEMO_LANDING_STATS.recipients.toLocaleString() },
    { label: "Avg tip", value: `$${DEMO_LANDING_STATS.avgTip}` },
  ];

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-noise opacity-40" />
      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:pt-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-card-border bg-white/[0.03] px-3 py-1 text-xs text-muted">
          <span className="badge badge-bull">v0 trial</span>
          Tipper allowlist: @{config.trialTipper}
          <span className="text-muted/60">·</span>
          prod later @{config.prodTipperFuture}
        </div>

        <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          Tip <span className="text-accent-2">$ansem</span> when you like, reply,
          follow, or QT.
          <span className="mt-2 block text-bull">Super-tip on 🐂.</span>
        </h1>

        <p className="mt-5 max-w-2xl text-lg text-muted">
          Bull energy for CT. Connect X → Privy Solana wallet → deposit → set tip
          amounts. Recipients cash out $ansem to their own wallet. Gratitude flows
          to the culture fund — no product tokens.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/onboard" className="btn-primary">
            Start tipping
          </Link>
          <Link href="/withdraw" className="btn-ghost">
            I got tipped → withdraw
          </Link>
          <a
            href={explorerAddressUrl(config.gratitudeWallet)}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost"
          >
            Gratitude wallet
          </a>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="card p-4">
              <p className="text-xs uppercase tracking-wide text-muted">{s.label}</p>
              <p className="mt-1 font-mono text-2xl font-semibold">{s.value}</p>
              <p className="text-[10px] text-muted/70">placeholder · noice</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              t: "How it helps $ansem",
              d: "Every like/reply/follow/QT from the tipper routes $ansem to builders & CT natives — organic distribution with receipts.",
            },
            {
              t: "Super-tip 🐂",
              d: "Drop a bull in a comment or quote-tweet and the tip upgrades automatically. Signal + size.",
            },
            {
              t: "$ansem mint",
              d: "SPL on Solana. Verify the mint, tip from deposited balance, withdraw to personal wallets.",
            },
          ].map((c) => (
            <div key={c.t} className="card p-5">
              <h3 className="font-semibold">{c.t}</h3>
              <p className="mt-2 text-sm text-muted">{c.d}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 break-all font-mono text-xs text-muted">
          mint:{" "}
          <a
            className="text-accent hover:underline"
            href={explorerTokenUrl(config.ansemMint)}
            target="_blank"
            rel="noreferrer"
          >
            {config.ansemMint}
          </a>
        </p>
      </div>
    </section>
  );
}
