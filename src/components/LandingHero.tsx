import Image from "next/image";
import Link from "next/link";
import { MintChip } from "@/components/MintChip";
import { config } from "@/lib/config";
import { explorerAddressUrl, explorerTokenUrl } from "@/lib/solana";

export function LandingHero() {
  const tipper = config.tipperAllowlist[0] || config.trialTipper;
  const mintUrl = explorerTokenUrl(config.ansemMint);

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-noise opacity-50" />
      <div className="pointer-events-none absolute inset-0 vignette" />

      {/* Atmosphere: acid-green bull art — not a meme dump */}
      <div className="pointer-events-none absolute -right-8 top-10 hidden h-[420px] w-[320px] opacity-[0.22] blur-[1px] sm:block lg:right-4 lg:opacity-[0.28]">
        <Image
          src="/brand/1_photo.jpg"
          alt=""
          fill
          className="object-contain object-right"
          sizes="320px"
          priority
        />
      </div>
      <div className="pointer-events-none absolute -left-16 bottom-0 hidden h-[280px] w-[240px] opacity-[0.14] blur-[0.5px] md:block">
        <Image
          src="/brand/7_photo.jpg"
          alt=""
          fill
          className="object-contain object-left"
          sizes="240px"
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:pt-20">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-12">
          <div className="min-w-0 flex-1">
            <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-card-border bg-white/[0.03] px-3 py-1 text-xs text-muted">
              <span className="badge badge-bull">v0 trial</span>
              <span>
                Tipper: <strong className="text-foreground">@{tipper}</strong>
              </span>
              <span className="text-muted/60">·</span>
              <span>prod later @{config.prodTipperFuture}</span>
            </div>

            <p className="label-mono mt-5 text-accent text-glow">
              The Black Bull · $ansem · Solana
            </p>

            <h1 className="display-title mt-3 max-w-3xl text-5xl sm:text-7xl">
              Tip <span className="text-accent-2">$ansem</span>
              <span className="block text-foreground">on every like.</span>
              <span className="mt-2 block text-accent text-glow">Super-tip on 🐂.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">
              Trenches energy. Connect X → Privy Solana wallet → deposit → set
              amounts. Recipients withdraw $ansem. Inspired by Black Bull culture
              — tips in $ansem, receipts on-chain.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <MintChip mint={config.ansemMint} />
              <div className="chip">
                <span className="text-muted">Tipper</span>
                <span className="text-foreground">@{tipper}</span>
              </div>
              <a
                href={mintUrl}
                target="_blank"
                rel="noreferrer"
                className="chip hover:border-accent/60"
              >
                <span className="text-muted">Solscan</span>
                <span className="text-accent text-glow">Mint →</span>
              </a>
              <span className="badge badge-gold">SPL · Solana</span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/onboard" className="btn-primary">
                Start tipping
              </Link>
              <Link href="/withdraw" className="btn-ghost">
                Got tipped → withdraw
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
          </div>

          <div className="relative mx-auto w-full max-w-[280px] shrink-0 sm:max-w-[320px] lg:mx-0">
            <div className="absolute -inset-6 rounded-full bg-accent/10 blur-3xl" />
            <div className="card card-glow relative overflow-hidden p-2">
              <div className="relative aspect-square overflow-hidden rounded-[0.85rem] bg-black">
                <Image
                  src="/brand/ansem.png"
                  alt="The Black Bull — $ansem token art"
                  fill
                  className="object-cover"
                  sizes="320px"
                  priority
                />
              </div>
              <div className="flex items-center justify-between gap-2 px-2 py-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted">Token</p>
                  <p className="font-semibold tracking-tight">$ansem</p>
                </div>
                <a
                  href={mintUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="badge badge-bull"
                >
                  View mint
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            {
              t: "Herd distribution",
              d: "Likes, replies, follows, QTs from the tipper route $ansem to CT natives — organic flow with receipts.",
            },
            {
              t: "Super-tip 🐂",
              d: "Drop a bull in a comment or QT and the tip upgrades. Signal + size. No corporate vibes.",
            },
            {
              t: "Withdraw anywhere",
              d: "Recipients cash out SPL $ansem to their own Solana wallet. Mint is public — verify it.",
            },
          ].map((c) => (
            <div key={c.t} className="card p-5">
              <h3 className="font-semibold tracking-tight">{c.t}</h3>
              <p className="mt-2 text-sm text-muted">{c.d}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 break-all font-mono text-xs text-muted">
          mint:{" "}
          <a
            className="text-accent hover:underline"
            href={mintUrl}
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
