import Image from "next/image";
import Link from "next/link";
import { MintChip } from "@/components/MintChip";
import { SpreadStory } from "@/components/SpreadStory";
import { config } from "@/lib/config";

export function LandingHero() {
  const tippers = config.tipperAllowlist;

  return (
    <section className="relative overflow-hidden">
      <div className="hero-atmosphere">
        <Image
          src="/brand/1_photo.jpg"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      </div>
      <div className="pointer-events-none absolute inset-0 grid-noise opacity-50" />
      <div className="pointer-events-none absolute inset-0 vignette" />

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 sm:pt-14">
        <div className="stadium-in flex flex-wrap items-end gap-5">
          <div className="crt-bull-frame">
            <Image
              src="/brand/ansem.png"
              alt="ansem — The Black Bull"
              width={96}
              height={96}
              className="size-20 object-cover sm:size-24"
              priority
            />
          </div>
          <div>
            <p className="label-mono text-accent text-glow">The Black Bull</p>
            <h1 className="stadium-banner mt-2 max-w-4xl text-[clamp(2.75rem,12vw,6.5rem)]">
              <span className="block">ansem.tips</span>
              <span className="line-gold mt-1 block text-[0.55em]">
                Tip $ansem on every like.
              </span>
              <span className="line-accent mt-1 block text-[0.5em]">
                Super tip on 🐂.
              </span>
            </h1>
          </div>
        </div>

        <p className="stadium-in stadium-in-delay-1 mt-5 max-w-xl text-base text-muted sm:text-lg">
          Like someone. They get $ansem. Reply, follow, QT — same deal. Drop a
          bull emoji and they get more.
        </p>

        <div className="stadium-in stadium-in-delay-2 mt-7 flex flex-wrap gap-3">
          <Link href="/onboard" className="btn-primary">
            Start tipping
          </Link>
          <Link href="/withdraw" className="btn-ghost">
            Got tipped → withdraw
          </Link>
        </div>

        <div className="stadium-in stadium-in-delay-2 mt-5 flex flex-wrap items-center gap-2">
          <MintChip mint={config.ansemMint} />
          <div className="chip">
            <span className="text-muted">Tippers</span>
            <span className="text-foreground">
              {tippers.map((t) => `@${t}`).join(" · ")}
            </span>
          </div>
        </div>

        <div className="stadium-in stadium-in-delay-3 mt-10">
          <SpreadStory />
        </div>

        <div className="mt-12 grid gap-6 border-t border-card-border pt-10 sm:grid-cols-2">
          <div>
            <p className="step-num">Tipper path</p>
            <h2 className="mt-2 text-xl font-bold tracking-tight">
              Sign in. Deposit. Set amounts.
            </h2>
            <p className="mt-2 text-sm text-muted">
              When you like, reply, follow, or QT — they get tipped. 🐂 ups the
              size.
            </p>
            <Link href="/onboard" className="btn-primary mt-5">
              Onboard as tipper
            </Link>
          </div>
          <div>
            <p className="step-num">Withdraw path</p>
            <h2 className="mt-2 text-xl font-bold tracking-tight">
              Got engaged? Cash out.
            </h2>
            <p className="mt-2 text-sm text-muted">
              Sign in with X. See what landed. Send $ansem to your wallet.
            </p>
            <Link href="/withdraw" className="btn-ghost mt-5">
              Open withdraw
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
